import { dataAtualizada } from "../consts/dataAtualizada";
import { PostsDatabase } from "../database/PostsDatabase";
import { UsersDatabase } from "../database/UsersDatabase";
import { CreatePostInputDTO, CreatePostOutputDTO } from "../dtos/createPost.dto";
import { DeletePostInputDTO, DeletePostOutputDTO } from "../dtos/deletePost.dto";
import { EditPostInputDTO, EditPostOutputDTO } from "../dtos/editPost.dto";
import { GetPostsInputDTO, GetPostsOutputDTO } from "../dtos/getPosts.dto";
import { PutLikeInputDTO, PutLikeOutputDTO } from "../dtos/putLike.dto";
import { BadRequestError } from "../errors/BadRequestError";
import { NotFoundError } from "../errors/NotFoundError";
import { Post } from "../models/Post";
import { IdGenerator } from "../services/IdGenerator";
import { TokenManager } from "../services/TokenManager";
import { InputLikeDB } from "../types/InputLikeDB";
import {
  EditedPostToDB,
  PostInputDB,
  PostOutputDB
} from "../types/PostDB";
import { USER_ROLE } from "../types/USER_ROLE";

export class PostsBusiness {
  constructor(
    private postsDatabase: PostsDatabase,
    private usersDatabase: UsersDatabase,
    private idGenerator: IdGenerator,
    private tokenManager: TokenManager
  ) { }

  public getPosts = async (
    input: GetPostsInputDTO
  ): Promise<GetPostsOutputDTO[]> => {
    const { token, query } = input;

    const payload = this.tokenManager.getPayload(token);

    if (!payload) {
      throw new BadRequestError("Token inválido");
    }

    const posts: PostOutputDB[] | undefined = await this.postsDatabase.getPosts(
      query
    );

    if (!posts) {
      throw new NotFoundError("Nenhum post encontrado.");
    }

    const checkedPosts = [];

    for (let post of posts) {
      const likeDB = await this.postsDatabase.getLike(payload.id, post.id);
      let reaction: boolean | null;
      if (!likeDB) {
        reaction = null;
      } else {
        reaction = likeDB.like;
      }
      checkedPosts.push(
        new Post(
          post.id,
          post.content,
          post.likes,
          post.dislikes,
          post.comments,
          reaction,
          post.created_at,
          post.updated_at,
          { id: post.creator_id, name: post.name }
        )
      );
    }

    const output: GetPostsOutputDTO[] = checkedPosts.map((post) => {
      return {
        id: post.getId(),
        content: post.getContent(),
        likes: post.getLikes(),
        dislikes: post.getDislikes(),
        comments: post.getComments(),
        reaction: post.getReaction(),
        createdAt: post.getCreatedAt(),
        updatedAt: post.getUpdatedAt(),
        creator: post.getCreator(),
      };
    });
    return output;
  };

  public getPostById = async (input: any) => {
    const { id, token } = input;
    const payload = this.tokenManager.getPayload(token);

    if (!payload) {
      throw new BadRequestError("Token inválido");
    }
    const post = await this.postsDatabase.getPostByIdOutputForm(id);
    if (!post) {
      throw new NotFoundError("post não encontrado");
    }

    const likeDB = await this.postsDatabase.getLike(payload.id, post.id);
    let reaction: boolean | null;
    if (!likeDB) {
      reaction = null;
    } else {
      reaction = likeDB.like;
    }

    const checkedPost = new Post(
      post.id,
      post.content,
      post.likes,
      post.dislikes,
      post.comments,
      reaction,
      post.created_at,
      post.updated_at,
      { id: post.creator_id, name: post.name }
    );
    const output: GetPostsOutputDTO = {
      id: checkedPost.getId(),
      content: checkedPost.getContent(),
      likes: checkedPost.getLikes(),
      dislikes: checkedPost.getDislikes(),
      comments: checkedPost.getComments(),
      reaction: checkedPost.getReaction(),
      createdAt: checkedPost.getCreatedAt(),
      updatedAt: checkedPost.getUpdatedAt(),
      creator: checkedPost.getCreator(),
    };

    return output;
  };

  public createPost = async (
    input: CreatePostInputDTO
  ): Promise<CreatePostOutputDTO> => {
    const { content, token } = input;

    const payload = this.tokenManager.getPayload(token);

    if (!payload) {
      throw new BadRequestError("Token inválido");
    }

    const newPost: PostInputDB = {
      id: this.idGenerator.generate() as string,
      creator_id: payload.id as string,
      content: content as string,
    };

    const postExists = await this.postsDatabase.getPostByIdDBForm(newPost.id);

    if (postExists) {
      throw new BadRequestError("Post já existe.");
    }

    await this.postsDatabase.createPost(newPost);

    const output: CreatePostOutputDTO = {
      message: "Post criado com sucesso!",
    };
    return output;
  };

  public editPost = async (
    input: EditPostInputDTO
  ): Promise<EditPostOutputDTO> => {
    const { idToEdit, newContent, token } = input;

    const payload = this.tokenManager.getPayload(token);

    if (!payload) {
      throw new BadRequestError("Token inválido");
    }

    const postToEdit: PostOutputDB | undefined =
      await this.postsDatabase.getPostByIdOutputForm(idToEdit);

    if (!postToEdit) {
      throw new NotFoundError("Não existe comentário relacionado ao id");
    }

    if (payload.id !== postToEdit.creator_id) {
      throw new BadRequestError(
        "Somente o proprietário pode editar o post."
      );
    }

    const inputDB: EditedPostToDB = {
      idToEdit,
      newPost: {
        content: newContent,
        updated_at: dataAtualizada(),
      },
    };
    await this.postsDatabase.editPost(inputDB);

    const output: EditPostOutputDTO = {
      message: "Post alterado.",
    };
    return output;
  };

  public putLike = async (
    input: PutLikeInputDTO
  ): Promise<DeletePostOutputDTO> => {
    const { postId, like, token } = input;

    const payload = this.tokenManager.getPayload(token);

    if (!payload) {
      throw new BadRequestError("Token inválido");
    }

    const userId = payload.id;

    const inputLikeDB: InputLikeDB = {
      userId,
      postId,
      like,
    };


    const postDB = await this.postsDatabase.getPostByIdDBForm(postId);


    if (!postDB) {
      throw new NotFoundError("Post não existe.");
    }

    const userDB = await this.usersDatabase.getUserById(userId);


    if (!userDB) {
      throw new NotFoundError("Usuário não existe.");
    }


    if (postDB?.creator_id === userId) {
      throw new BadRequestError("Covê não pode reagir ao próprio post.");
    }

    const likeDB = await this.postsDatabase.getLike(
      inputLikeDB.userId,
      inputLikeDB.postId
    );

    let output: PutLikeOutputDTO = {
      message: "",
    };


    if (!likeDB) {

      await this.postsDatabase.createLike(inputLikeDB);
      await this.postsDatabase.addLikeInPost(inputLikeDB);
      output.message = "Seu Like ou Dislike foi enviado!";
    } else {


      if (likeDB.like === like) {


        await this.postsDatabase.deleteLike(inputLikeDB);

        await this.postsDatabase.decreaseLikeInPost(inputLikeDB);
        output.message = "Seu Like ou Dislike foi removido!";
      } else {


        await this.postsDatabase.changeLike(inputLikeDB);

        await this.postsDatabase.overwriteLikeInPost(inputLikeDB);
        output.message = "Seu Like ou Dislike foi alterado!";
      }
    }
    return output;
  };

  public deletePost = async (
    input: DeletePostInputDTO
  ): Promise<DeletePostOutputDTO> => {
    const { idToDelete, token } = input;

    const payload = this.tokenManager.getPayload(token);

    if (!payload) {
      throw new BadRequestError("Token inválido");
    }

    const postExists = await this.postsDatabase.getPostByIdDBForm(idToDelete);
    if (!postExists) {
      throw new NotFoundError(
        "Não existe comentário relacionado ao id."
      );
    }

    if (
      payload.id !== postExists.creator_id &&
      payload.role !== USER_ROLE.ADMIN
    ) {
      throw new BadRequestError(
        "Somente o proprietário pode excluir o post."
      );
    }

    await this.postsDatabase.deletePost(idToDelete);
    const output: DeletePostOutputDTO = {
      message: "Seu post foi excluído",
    };
    return output;
  };
}
