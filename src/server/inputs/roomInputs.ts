import { IsIn, IsNotEmpty, IsString, validate, ValidationError } from 'class-validator';
import { FieldsOnCorrectTypeRule } from 'graphql';
import {
  createRoomInput,
  deleteRoomInput,
  gistUpdate,
  GistUpdateType,
  gistUpdateTypeArr,
  roomInput,
} from 'Shared/types/roomTypes';
import { ArgumentValidationError, Field, ID, InputType, Int } from 'type-graphql';
import { fileURLToPath } from 'url';

@InputType()
export class RoomInput implements roomInput {
  @Field(() => String, { nullable: true })
  hashId?: string;

  @Field(() => ID, { nullable: true })
  id?: number;
}
@InputType()
export class CreateRoomInput implements createRoomInput {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  gistName?: string;

  @Field(() => ID)
  ownerId: string;

  @Field(() => String, { nullable: true })
  createdGistUrl?: string;
}

@InputType()
export class DeleteRoomInput implements deleteRoomInput {
  @Field(() => ID)
  id: string;
}

@InputType()
export class FileInput {
  @Field(() => String)
  filename: string;

  @Field(() => String)
  content: string;
}

@InputType()
export class UpdateRoomGistInput {
  @Field(() => Int)
  @IsIn(gistUpdateTypeArr)
  type: number;

  @Field(() => String, { nullable: true })
  @IsString({ groups: ['create'] })
  name?: string;

  @Field(() => String, { nullable: true })
  @IsString({ groups: ['create'] })
  description?: string;

  @Field(() => String, { nullable: true })
  @IsString({ groups: ['import', 'delete'] })
  gistId?: string;
}

@InputType()
export class UpdateRoomInput {
  @Field(() => ID)
  roomHashId: string;

  @Field(() => String)
  roomName: string;

  @Field(() => UpdateRoomGistInput)
  gistUpdate: UpdateRoomGistInput;
}

export function validateUpdateRoomGistInput(input: UpdateRoomGistInput): UpdateRoomGistInput {
  const { type } = input;
  const { None, Delete, Create, Import } = GistUpdateType;

  switch (type) {
    case Create:
      validate(input, { groups: ['create'] });
    case Import:
      validate(input, { groups: ['import'] });
      break;
    case Delete:
      validate(input, { groups: ['delete'] });
      break;
    case None:
      break;
      return { type: None };
  }
  return input;
}
