import { clientSideRoom, room } from './roomTypes';
import { user } from './userTypes';

export interface roomVisit {
  id: number;
  room: room;
  user: user;
  visitTime: Date;
}

export interface roomVisitsInput {
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  roomIds?: string[];
  userIds?: string[];
  first?: number;
  sort?: 'ascending' | 'descending';
}
