import { UserEntity } from "@app/user/user.entity";
import { HttpCode, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, getRepository, Repository } from "typeorm";
import { ArticleEntity } from "./article.entity";
import { CreateArticleDto } from "./dto/createArticle.dto";
import { ArticleResponseInterface } from "./types/articleResponse.interface";
import slugify from 'slugify';
import { UpdateArticleDto } from "@app/article/dto/updateArticle.dto";
import { ArticlesResponseInterface } from "@app/article/types/articlesResponse.interface";

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) { }

  async findAll(currentUserId: number, query: any): Promise<ArticlesResponseInterface>{
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
    
    queryBuilder.orderBy('articles.createdAt', 'DESC');
        
    if (query.limit) {
      queryBuilder.limit(query.limit);
    }
    
    if (query.offset) {
      queryBuilder.offset(query.offset);
    }
    
    const articlesCount = await queryBuilder.getCount();
    const articles = await queryBuilder.getMany();

    return { articles, articlesCount }
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

  buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
    return { article };
  }

  private getSlug(title: string): string {
    return (slugify(title, { lower: true }) + '-' + ((Math.random() * Math.pow(36, 6))).toString(36));
  }
}