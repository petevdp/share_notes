import { roomVisitsInput } from 'Shared/types/roomVisitTypes';
import { Field, InputType } from 'type-graphql';

@InputType()
export class RoomVisitsInput implements roomVisitsInput {
  @Field(() => Date, { nullable: true })
  dateRangeStart?: Date;
  @Field(() => Date, { nullable: true })
  dateRangeEnd?: Date;
  @Field(() => [String], { nullable: true })
  roomIds?: string[];
  @Field(() => [String], { nullable: true })
  userIds?: string[];
  @Field(() => Number, { nullable: true })
  first?: number;

  @Field(() => String, { nullable: true })
  sort?: 'ascending' | 'descending';
}
