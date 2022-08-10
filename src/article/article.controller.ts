import { User } from "@app/user/decorators/user.decorator";
import { AuthGuard } from "@app/user/guards/auth.guard";
import { UserEntity } from "@app/user/user.entity";
import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { ArticleService } from "@app/article/article.service";
import { CreateArticleDto } from "@app/article/dto/createArticle.dto";
import { ArticleResponseInterface } from "@app/article/types/articleResponse.interface";
import { DeleteResult } from "typeorm";
import { UpdateArticleDto } from "@app/article/dto/updateArticle.dto";

@Controller('articles')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
  ) { }

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
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
    return await this.articleService.buildArticleResponse(article);
  }
}