import { UserEntity } from "@app/user/user.entity";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, getRepository, Repository } from "typeorm";
import { ArticleEntity } from "./article.entity";
import { CreateArticleDto } from "./dto/createArticle.dto";
import { ArticleResponseInterface } from "./types/articleResponse.interface";
import slugify from 'slugify';
import { UpdateArticleDto } from "@app/article/dto/updateArticle.dto";
import { ArticlesResponseInterface } from "@app/article/types/articlesResponse.interface";
import { FollowEntity } from "@app/profile/follow.entity";

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>
  ) { }

  async findAll(currentUserId: number, query: any): Promise<ArticlesResponseInterface> {
    const queryBuilder = getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author');

    if (query.tag) {
      queryBuilder.andWhere('articles.tagList LIKE :tag', {
        tag: `%${query.tag}%`
      });
    }

    if (query.author) {
      const author = await this.userRepository.findOne({
        username: query.author,
      });
      queryBuilder.andWhere('articles.authorId = :id', {
        id: author.id
      });
    }

    if (query.favorited) {
      const author = await this.userRepository.findOne({
        username: query.favorited
      },
        { relations: ['favorites'] },
      );
      const ids = author.favorites.map(el => el.id);

      if (ids.length > 0) { // Typeorm bug, evaluates the query even with empty ids
        queryBuilder.andWhere('articles.id IN (:...ids)', { ids });
      } else {
        queryBuilder.andWhere('1=0'); // fetch any articles because '1=0' = false
      }
    }

    queryBuilder.orderBy('articles.createdAt', 'DESC');
    const articlesCount = await queryBuilder.getCount();

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    let favoriteIds: number[] = [];

    if (currentUserId) {
      const currentUser = await this.userRepository.findOne(currentUserId, {
        relations: ['favorites']
      });
      favoriteIds = currentUser.favorites.map(favorite => favorite.id);
    }

    const articles = await queryBuilder.getMany();
    const articlesWithFavorited = articles.map(article => {
      const favorited = favoriteIds.includes(article.id);
      return { ...article, favorited }
    })

    return { articles: articlesWithFavorited, articlesCount };
  }

  async getFeed(currentUserId: number, query: any): Promise<ArticlesResponseInterface> {
    const follows = await this.followRepository.find({
      followerId: currentUserId,
    });

    if (follows.length === 0) {
      return { articles: [], articlesCount: 0 };
    }

    const followingUserIds = follows.map(follow => follow.followingId);
    const queryBuilder = getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author')
      .where('articles.authorId IN (:...ids)', { ids: followingUserIds });

    queryBuilder.orderBy('articles.createdAt', 'DESC');

    const articlesCount = await queryBuilder.getCount();

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    const articles = await queryBuilder.getMany();

    return { articles, articlesCount };
  }

  async createArticle(currentUser: UserEntity, createArticleDto: CreateArticleDto): Promise<ArticleEntity> {
    const article = new ArticleEntity();
    Object.assign(article, createArticleDto);
    if (!article.tagList) {
      article.tagList = []
    }
    article.slug = this.getSlug(createArticleDto.title);
    article.author = currentUser;
    return await this.articleRepository.save(article);
  }

  async deleteBySlugId(slug: string, currentUserId: number): Promise<DeleteResult> {
    const article = await this.findBySlugId(slug);
    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }
    if (article.author.id !== currentUserId) {
      throw new HttpException('You are not an author', HttpStatus.FORBIDDEN);
    }
    return await this.articleRepository.delete({ slug });
  }

  async updateBySlugId(slug: string, currentUserId: number, updateArticleDto: UpdateArticleDto): Promise<ArticleEntity> {
    const article = await this.findBySlugId(slug);
    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }
    if (article.author.id !== currentUserId) {
      throw new HttpException('You are not an author', HttpStatus.FORBIDDEN);
    }
    Object.assign(article, updateArticleDto);
    article.slug = this.getSlug(updateArticleDto.title);
    return await this.articleRepository.save(article);
  }

  async findBySlugId(slug: string): Promise<ArticleEntity> {
    return await this.articleRepository.findOne({ slug });
  }

  async addArticleToFavorites(slug: string, currentUserId: number): Promise<ArticleEntity> {
    const article = await this.findBySlugId(slug);
    const user = await this.userRepository.findOne(currentUserId, {
      relations: ['favorites']
    });

    const isNotFavorited =
      user.favorites.findIndex(
        articlesInFavorites => articlesInFavorites.id === article.id
      ) === -1;

    if (isNotFavorited) {
      user.favorites.push(article);
      article.favoritesCount++;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }
    return article;
  }

  async removeArticleToFavorites(slug: string, currentUserId: number): Promise<ArticleEntity> {
    const article = await this.findBySlugId(slug);
    const user = await this.userRepository.findOne(currentUserId, {
      relations: ['favorites']
    });

    const articleIndex =
      user.favorites.findIndex(
        articlesInFavorites => articlesInFavorites.id === article.id
      );

    if (articleIndex >= 0) {
      user.favorites.splice(articleIndex, 1);
      article.favoritesCount--;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }
    return article;
  }

  buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
    return { article };
  }

  private getSlug(title: string): string {
    return (slugify(title, { lower: true }) + '-' + ((Math.random() * Math.pow(36, 6))).toString(36));
  }
}