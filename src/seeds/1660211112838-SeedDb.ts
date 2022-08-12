import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedDb1660211112838 implements MigrationInterface {
  name = 'SeedDb1660211112838'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`INSERT INTO tags (name) VALUES ('dragons'), ('coffe'), ('nestjs')`);

    await queryRunner.query(
      // password = 123
      `INSERT INTO users (username, email, password) VALUES ('foo', 'foo@gmail.com', '$2b$10$QYw3kMZcT3zDHI340j93p.eXzKP4qz1rsgFSYVL1g/wgI9MmmONpq')`
    );

    await queryRunner.query(
      `INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES ('first-article', 'First article', 'First article description', 'First article body', 'coffe,dragons', 1), ('second-article', 'Second article', 'Second article description', 'Second article body', 'coffe,dragons', 1)`
    );
  }

  public async down(): Promise<void> { }

}
