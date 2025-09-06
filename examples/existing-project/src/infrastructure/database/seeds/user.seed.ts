import { User, UserRole } from '../../../domain/users/user.entity';
import * as bcrypt from 'bcrypt';

export const userSeeds: Partial<User>[] = [
  {
    name: '관리자',
    email: 'admin@example.com',
    password: bcrypt.hashSync('admin123!', 10),
    role: UserRole.ADMIN,
    isActive: true,
  },
  {
    name: '홍길동',
    email: 'hong@example.com',
    password: bcrypt.hashSync('user123!', 10),
    role: UserRole.USER,
    isActive: true,
  },
  {
    name: '김영희',
    email: 'kim@example.com',
    password: bcrypt.hashSync('user123!', 10),
    role: UserRole.USER,
    isActive: true,
  },
  {
    name: '박민수',
    email: 'park@example.com',
    password: bcrypt.hashSync('user123!', 10),
    role: UserRole.USER,
    isActive: false,
  },
  {
    name: '테스트 사용자1',
    email: 'test1@example.com',
    password: bcrypt.hashSync('test123!', 10),
    role: UserRole.USER,
    isActive: true,
  },
  {
    name: '테스트 사용자2',
    email: 'test2@example.com',
    password: bcrypt.hashSync('test123!', 10),
    role: UserRole.USER,
    isActive: true,
  },
  {
    name: '개발자',
    email: 'dev@example.com',
    password: bcrypt.hashSync('dev123!', 10),
    role: UserRole.ADMIN,
    isActive: true,
  },
];

export const testCredentials = {
  admin: {
    email: 'admin@example.com',
    password: 'admin123!',
    role: UserRole.ADMIN,
  },
  user: {
    email: 'hong@example.com',
    password: 'user123!',
    role: UserRole.USER,
  },
  dev: {
    email: 'dev@example.com',
    password: 'dev123!',
    role: UserRole.ADMIN,
  },
  test1: {
    email: 'test1@example.com',
    password: 'test123!',
    role: UserRole.USER,
  },
};
