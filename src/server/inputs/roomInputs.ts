import { IsIn, IsString, validate } from 'class-validator';
import { createRoomInput, deleteRoomInput, GistUpdateType, gistUpdateTypeArr, roomInput } from 'Shared/types/roomTypes';
import { Field, ID, InputType, Int } from 'type-graphql';

@InputType()
export class RoomInput implements roomInput {
  @Field(() => String)
  hashId: string;
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
  @Field(() => String)
  hashId: string;
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
