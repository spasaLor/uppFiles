/*
  Warnings:

  - Made the column `url` on table `files` required. This step will fail if there are existing NULL values in that column.
  - Made the column `size` on table `files` required. This step will fail if there are existing NULL values in that column.
  - Made the column `upload_time` on table `files` required. This step will fail if there are existing NULL values in that column.
  - Made the column `owner_id` on table `files` required. This step will fail if there are existing NULL values in that column.
  - Made the column `folder_id` on table `files` required. This step will fail if there are existing NULL values in that column.
  - Made the column `owner_id` on table `folders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `username` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "files" ALTER COLUMN "url" SET NOT NULL,
ALTER COLUMN "size" SET NOT NULL,
ALTER COLUMN "upload_time" SET NOT NULL,
ALTER COLUMN "upload_time" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "owner_id" SET NOT NULL,
ALTER COLUMN "folder_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "folders" ALTER COLUMN "owner_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
