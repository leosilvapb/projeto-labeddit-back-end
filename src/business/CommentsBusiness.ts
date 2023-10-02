import { dataAtualizada } from "../consts/dataAtualizada";
import { CommentsDatabase } from "../database/CommentsDatabase";
import { PostsDatabase } from "../database/PostsDatabase";
import { UsersDatabase } from "../database/UsersDatabase";
import {
  CreateCommentInputDTO,
  CreateCommentOutputDTO,
} from "../dtos/createComment.dto";
import { DeleteCommentInputDTO, DeleteCommentOutputDTO } from "../dtos/deleteComment.dto";
import { EditCommentInputDTO, EditCommentOutputDTO } from "../dtos/editComment.dto";
import {
  GetCommentsInputDTO,
  GetCommentsOutputDTO,
} from "../dtos/getComments.dto";
import { PutLikeCommentInputDTO, PutLikeCommentOutputDTO } from "../dtos/putLikeComment.dto";
import { BadRequestError } from "../errors/BadRequestError";
import { NotFoundError } from "../errors/NotFoundError";
import { Comment } from "../models/Comment";
import { IdGenerator } from "../services/IdGenerator";
import { TokenManager } from "../services/TokenManager";
import { CommentInputDB, CommentOutputDB, EditedCommentToDB } from "../types/Comment";
import { InputCommentLikeDB } from "../types/InputLikeDB";
import { USER_ROLE } from "../types/USER_ROLE";

export class CommentsBusiness {
  constructor(
    private commentsDatabase: CommentsDatabase,
    private postsDatabase: PostsDatabase,
    private usersDatabase: UsersDatabase,
    private idGenerator: IdGenerator,
    private tokenManager: TokenManager
  ) { }

  public getComments = async (
    input: GetCommentsInputDTO
  ): Promise<GetCommentsOutputDTO[]> => {
    const { token, postId } = input;

    const payload = this.tokenManager.getPayload(token);

    const postExists = await this.postsDatabase.getPostByIdDBForm(postId);

    if (!payload) {
      throw new BadRequestError("Token inválido");
    }

    if (!postExists) {
      throw new NotFoundError("Post não existe");
    }

    const commentsDB: CommentOutputDB[] | undefined = await this.commentsDatabase.getComments(postId);

    if (!commentsDB) {
      throw new NotFoundError("Este post não possui comentários.");
    }

    const comments = []

    for (let comment of commentsDB) {
      const likeDB = await this.commentsDatabase.getLike(payload.id, comment.id);
      let reaction: boolean | null;
      if (!likeDB) {
        reaction = null;
      } else {
        reaction = likeDB.like;
      }
      comments.push(
        new Comment(
          comment.id,
          comment.content,
          comment.likes,
          comment.dislikes,
          reaction,
          comment.created_at,
          comment.updated_at,
          comment.post_id,
          { id: comment.creator_id, name: comment.name }
        )
      )
    }

    const output: GetCommentsOutputDTO[] = comments.map((comment) => {
      return {
        id: comment.getId(),
        content: comment.getContent(),
        likes: comment.getLikes(),
        dislikes: comment.getDislikes(),
        reaction: comment.getReaction(),
        createdAt: comment.getCreatedAt(),
        updatedAt: comment.getUpdatedAt(),
        postId: comment.getPostId(),
        creator: comment.getCreator(),
      };
    });
    return output;
  };

  public createComment = async (
    input: CreateCommentInputDTO
  ): Promise<CreateCommentOutputDTO> => {
    const { token, postId, content } = input;

    const payload = this.tokenManager.getPayload(token);

    if (!payload) {
      throw new BadRequestError("Token inválido");
    }

    const postExists = await this.postsDatabase.getPostByIdDBForm(postId);

    if (!postExists) {
      throw new BadRequestError("Postagem não existe.");
    }

    const newComment: CommentInputDB = {
      id: this.idGenerator.generate() as string,
      creator_id: payload.id as string,
      post_id: postId,
      content: content,
      created_at: dataAtualizada(),
    };

    await this.commentsDatabase.createComment(newComment);

    const output: CreateCommentOutputDTO = {
      message: "Comentário publicado com sucesso!",
    };
    return output;
  };
  public editComment = async (
    input: EditCommentInputDTO
  ): Promise<EditCommentOutputDTO> => {
    const { token, commentToEditId, newContent, } = input;

    const payload = this.tokenManager.getPayload(token);

    if (!payload) {
      throw new BadRequestError("Token inválido");
    }

    const commentToEdit: CommentOutputDB | undefined =
      await this.commentsDatabase.getCommentById(commentToEditId);

    if (!commentToEdit) {
      throw new NotFoundError("Não existe comentário relacionado ao id");
    }

    if (payload.id !== commentToEdit.creator_id) {
      throw new BadRequestError(
        "Somente o proprietário pode editar o omentário."
      );
    }

    const inputToEditDB: EditedCommentToDB = {
      idToEdit: commentToEditId,
      newComment: {
        content: newContent,
        updated_at: dataAtualizada(),
      },
    };
    await this.commentsDatabase.editComment(inputToEditDB);

    const output: EditCommentOutputDTO = {
      message: "Comentário alterado!",
    };
    return output;
  };

  public putLikeComment = async (
    input: PutLikeCommentInputDTO
  ): Promise<PutLikeCommentOutputDTO> => {
    const { token, commentId, like } = input;

    const payload = this.tokenManager.getPayload(token);

    if (!payload) {
      throw new BadRequestError("Token inválido");
    }

    const userId = payload.id;

    const inputLikeDB: InputCommentLikeDB = {
      userId,
      commentId,
      like,
    };

    const commentDB = await this.commentsDatabase.getCommentById(commentId);


    if (!commentDB) {
      throw new NotFoundError("Comentário não existe.");
    }

    const userDB = await this.usersDatabase.getUserById(userId);


    if (!userDB) {
      throw new NotFoundError("Usuário não existe.");
    }

    if (commentDB?.creator_id === userId) {
      throw new BadRequestError("Você não pode reagir ao próprio comentário.");
    }

    const likeDB = await this.commentsDatabase.getLike(inputLikeDB.userId, inputLikeDB.commentId);

    let output: PutLikeCommentOutputDTO = {
      message: "",
    };


    if (!likeDB) {

      await this.commentsDatabase.createLike(inputLikeDB);
      await this.commentsDatabase.addLikeInComment(inputLikeDB);
      output.message = "Seu Like ou Dislike foi enviado!";
    } else {
      if (likeDB.like === like) {
        await this.commentsDatabase.deleteLike(inputLikeDB);
        await this.commentsDatabase.decreaseLikeInComment(inputLikeDB);
        output.message = "Seu Like ou Dislike foi removido!";
      } else {
        await this.commentsDatabase.changeLike(inputLikeDB);
        await this.commentsDatabase.overwriteLikeInComment(inputLikeDB);
        output.message = "Seu Like ou Dislike foi alterado!";
      }
    }
    return output;
  };

  public deleteComment = async (
    input: DeleteCommentInputDTO
  ): Promise<DeleteCommentOutputDTO> => {
    const { token, idToDelete } = input;

    const payload = this.tokenManager.getPayload(token);

    if (!payload) {
      throw new BadRequestError("Token inválido");
    }

    const commentExists = await this.commentsDatabase.getCommentById(idToDelete);
    if (!commentExists) {
      throw new NotFoundError(
        "Não existe comentário relacionado ao id."
      );
    }

    if (payload.id !== commentExists.creator_id && payload.role !== USER_ROLE.ADMIN) {
      throw new BadRequestError(
        "Somente o proprietário pode excluir o comentário."
      );
    }

    await this.commentsDatabase.deleteComment(idToDelete, commentExists.post_id);
    const output: DeleteCommentOutputDTO = {
      message: "Comentário excluído",
    };
    return output;
  };
}
