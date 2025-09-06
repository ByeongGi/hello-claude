import { User } from '@/domain/users/user.entity';
import { QueryUsersDto } from '../dto/query-users.dto';

export interface IUserRepository {
  create(userData: Partial<User>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findMany(query: QueryUsersDto): Promise<{ users: User[]; total: number }>;
  update(id: string, userData: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}
