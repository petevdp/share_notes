import { roomVisitsInput } from 'Shared/types/roomVisitTypes';
import { Field, ID, InputType, Int } from 'type-graphql';

@InputType()
export class RoomVisitsInput implements roomVisitsInput {
  @Field(() => Date, { nullable: true })
  dateRangeStart?: Date;
  @Field(() => Date, { nullable: true })
  dateRangeEnd?: Date;
  @Field(() => [ID], { nullable: true })
  roomIds?: string[];
  @Field(() => [ID], { nullable: true })
  userIds?: string[];
  @Field(() => Int, { nullable: true })
  first?: number;

  @Field(() => String, { nullable: true })
  sort?: 'ascending' | 'descending';
}
