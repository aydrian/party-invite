# Invite App

A Remix app that uses CockroachDB to track party invites and is deployed on Fly.

## 🥞 Tech Stack

- Web Framework - 💿 [Remix](https://remix.run/)
- Database - 🪳 [CockroachDB](https://www.cockroachlabs.com/)
- Database ORM - △ [Prisma](https://www.prisma.io/)
- Styling - 🍃 [Tailwind CSS](https://tailwindcss.com/)
- UI Components - 🧱 [shadcn/ui](https://ui.shadcn.com/) and [Radix](https://www.radix-ui.com/)
- Hosting - 🎈 [Fly](https://fly.io/)

## 💾 Database Setup

This application uses Prisma to manage our database.

### 🧳 Migrate Schema Changes

1. Update the `DATABASE_URL` environment variable with your CockroachDB connection string.
1. Run `npx prisma migrate` to create the database schema.

## 🧑‍💻 Development

### 🌱 Seed the Database

If you are starting with a blank database, you can populate it by running the following command

```shell
npx prisma db seed
```

### 💿 Run the Remix app locally

- From your terminal:

  ```sh
  npm run dev
  ```

  This starts your app in development mode, rebuilding assets on file changes.

- Open up [https://localhost:3000](https://localhost:3000) and you should be ready to go!

## 🚧 Deployment

This app is set up to deploy to [Fly.io](https://fly.io/) and comes with a GitHub Action that handles automatically deploying the app to production.

Prior to your first deployment, you'll need to do a few things:

- [Install Fly](https://fly.io/docs/getting-started/installing-flyctl/)

- Sign up and log in to Fly

  ```sh
  fly auth signup
  ```

  > **Note**: If you have more than one Fly account, ensure that you are signed
  > into the same account in the Fly CLI as you are in the browser. In your
  > terminal, run `fly auth whoami` and ensure the email matches the Fly account
  > signed into the browser.

- Create a new app on Fly:

  ```sh
  fly apps create [YOUR_APP_NAME]
  ```

  > **Note**: Make sure this name matches the `app` set in your `fly.toml` file.
  > Otherwise, you will not be able to deploy.

- Add a `FLY_API_TOKEN` to your GitHub repo. To do this, go to your user
  settings on Fly and create a new
  [token](https://web.fly.io/user/personal_access_tokens/new), then add it to
  [your repo secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
  with the name `FLY_API_TOKEN`.

- Add your environment vacriables to your fly app secrets, to do this you can run the following commands:

  ```sh
  fly secrets set DATABASE_URL="postgresql://" [additional secrets] --app [YOUR_APP_NAME]
  ```

Now that everything is set up you can commit and push your changes to your repo.
Every commit to your `main` branch will trigger a deployment to your production
environment.

## 📝 License

Copyright © 2023 [itsaydrian.com](https://itsaydrian.com). <br />
This project is [MIT](./LICENSE) licensed.
