import z from "zod";

export interface CreateUserInputDTO {
  name: string;
  email: string;
  password: string;
}

export interface CreateUserOutputDTO {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    createdAt: string;
  };
}

export const CreateUserInputSchema = z
  .object({
    name: z
      .string({
        required_error: "'name' é obrigatório para efetuar a requisição",
        invalid_type_error: "'name' deve ser do tipo string",
      })
      .min(4, { message: "Apelido deve conter ao menos 4 caracteres" })
      .max(20, { message: "Apelido deve conter no máximo 20 caracteres" }),
    email: z
      .string({
        required_error: "'email' é obrigatório para efetuar a requisição",
        invalid_type_error: "'email' deve ser do tipo string",
      })
      .email({ message: "'email' deve ter o formato 'meuemail@email.com'" }),
    password: z
      .string({
        required_error: "'password' é obrigatório para efetuar a requisição",
        invalid_type_error: "'password' deve ser do tipo string",
      })
      .min(4, { message: "A senha deve conter de 4 a 12 caracteres. Ex: abcdef12" })
      .max(12, { message: "A senha deve conter de 4 a 12 caracteres. Ex: abcdef12" })
  })
  .transform((data) => data as CreateUserInputDTO);
