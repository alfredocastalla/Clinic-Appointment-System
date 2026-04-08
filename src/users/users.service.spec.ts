import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const userData = { name: 'John', email: 'john@example.com', password: 'password', role: 'user' };
      const hashedPassword = 'hashedpassword';
      const createdUser = { id: 1, ...userData, password: hashedPassword };

      jest.spyOn(require('bcrypt'), 'hash').mockResolvedValue(hashedPassword);
      repo.create.mockReturnValue(createdUser);
      repo.save.mockResolvedValue(createdUser);

      const result = await service.create(userData);

      expect(require('bcrypt').hash).toHaveBeenCalledWith(userData.password, 10);
      expect(repo.create).toHaveBeenCalledWith({ ...userData, password: hashedPassword });
      expect(repo.save).toHaveBeenCalledWith(createdUser);
      expect(result).toBe(createdUser);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [{ id: 1, name: 'John' }];
      repo.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalled();
      expect(result).toBe(users);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = { id: 1, name: 'John' };
      repo.findOne.mockResolvedValue(user);

      const result = await service.findOne(1);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBe(user);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const user = { id: 1, email: 'john@example.com' };
      repo.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('john@example.com');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'john@example.com' } });
      expect(result).toBe(user);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateData = { name: 'John Updated' };
      const updatedUser = { id: 1, name: 'John Updated' };

      repo.update.mockResolvedValue(undefined);
      repo.findOne.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateData);

      expect(repo.update).toHaveBeenCalledWith(1, updateData);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBe(updatedUser);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      repo.delete.mockResolvedValue(undefined);

      const result = await service.remove(1);

      expect(repo.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ deleted: true });
    });
  });
});
