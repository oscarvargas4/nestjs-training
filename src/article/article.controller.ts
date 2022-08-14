import { User } from "@app/user/decorators/user.decorator";
import { AuthGuard } from "@app/user/guards/auth.guard";
import { UserEntity } from "@app/user/user.entity";
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UsePipes } from "@nestjs/common";
import { ArticleService } from "@app/article/article.service";
import { CreateArticleDto } from "@app/article/dto/createArticle.dto";
import { ArticleResponseInterface } from "@app/article/types/articleResponse.interface";
import { DeleteResult } from "typeorm";
import { UpdateArticleDto } from "@app/article/dto/updateArticle.dto";
import { ArticlesResponseInterface } from "@app/article/types/articlesResponse.interface";
import { BackendValidationPipe } from "@app/shared/pipes/backendValidation.pipe";

@Controller('articles')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
  ) { }

  @Get()
  async findAll(@User('id') currentUserId: number, @Query() query: any): Promise<ArticlesResponseInterface> {
    return await this.articleService.findAll(currentUserId, query);
  }

  @Get('feed')
  @UseGuards(AuthGuard)
  async getFeed(
    @User('id') currentUserId: number,
    @Query() query: any
  ): Promise<ArticlesResponseInterface> {
    return await this.articleService.getFeed(currentUserId, query);
  }

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new BackendValidationPipe())
  async create(@User() currentUser: UserEntity, @Body('article') createArticleDto: CreateArticleDto): Promise<ArticleResponseInterface> {
    const article = await this.articleService.createArticle(currentUser, createArticleDto);
    return this.articleService.buildArticleResponse(article);
  }

  @Get(':slug')
  async singleArticle(@Param('slug') slugId: string): Promise<ArticleResponseInterface> {
    const article = await this.articleService.findBySlugId(slugId);
    return this.articleService.buildArticleResponse(article);
  }

  @Delete(':slug')
  @UseGuards(AuthGuard)
  async deleteArticle(@User('id') currentUserId: number, @Param('slug') slugId: string): Promise<DeleteResult> {
    return await this.articleService.deleteBySlugId(slugId, currentUserId);
  }

  @Put(':slug')
  @UseGuards(AuthGuard)
  async updateArticle(
    @Body('article') updateArticleDto: UpdateArticleDto,
    @Param('slug') slugId: string,
    @User('id') currentUserId: number
  ): Promise<ArticleResponseInterface> {
    const article = await this.articleService.updateBySlugId(slugId, currentUserId, updateArticleDto);
    return this.articleService.buildArticleResponse(article);
  }

  @Post(':slug/favorite')
  @UseGuards(AuthGuard)
  async addArticleToFavorites(
    @Param('slug') slugId: string,
    @User('id') currentUserId: number
  ): Promise<ArticleResponseInterface> {
    const article = await this.articleService.addArticleToFavorites(slugId, currentUserId);
    return this.articleService.buildArticleResponse(article);
  }

  @Delete(':slug/favorite')
  @UseGuards(AuthGuard)
  async removeArticleToFavorites(
    @Param('slug') slugId: string,
    @User('id') currentUserId: number
  ): Promise<ArticleResponseInterface> {
    const article = await this.articleService.removeArticleToFavorites(slugId, currentUserId);
    return this.articleService.buildArticleResponse(article);
  }
}