dpoint                             | Description                     |
| -------- | ------------------------------------ | ------------------------------- |
| `GET`    | `/api/checkers/campaign/:campaignId` | Get all checkers for a campaign |
| `GET`    | `/api/checkers/:id`                  | Get checker by ID with rules    |
| `POST`   | `/api/checkers`                      | Create new checker              |
| `PUT`    | `/api/checkers/:id`                  | Update checker                  |
| `DELETE` | `/api/checkers/:id`                  | Delete checker                  |

### Rules

| Method   | Endpoint                         | Description         |
| -------- | -------------------------------- | ------------------- |
| `POST`   | `/api/checkers/:checkerId/rules` | Add rule to checker |
| `DELETE` | `/api/checkers/rules/:ruleId`    | Delete rule         |

For detailed API documentation, refer to the backend source code.

## Troubleshooting

### Port Already in Use

If port 3000 or 5000 is already in use:

```bash
# Frontend (change port)
npm run dev -- -p 3001

# Backend (update PORT in .env)
PORT=5001 npm run dev
```

### Database Connection Error

1. Verify MySQL is running
2. Check database credentials in `.env`
3. Ensure the database exists:
   ```bash
   mysql -u root -p
   CREATE DATABASE audience_checker;
   ```

### Dependencies Installation Issues

Clear cache and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

1. Create a new branch for your feature
2. Make changes in frontend/backend directories
3. Test locally with `npm run dev`
4. Build and verify with `npm run build`
5. Commit changes with clear messages
6. Push to repository and create a pull request

## Environment Variables Reference

### Backend (.env)

| Variable      | Description           | Example                 |
| ------------- | --------------------- | ----------------------- |
| `PORT`        | API server port       | `5000`                  |
| `NODE_ENV`    | Environment mode      | `development`           |
| `DB_HOST`     | Database host         | `localhost`             |
| `DB_PORT`     | Database port         | `3306`                  |
| `DB_USER`     | Database user         | `root`                  |
| `DB_PASSWORD` | Database password     | `password`              |
| `DB_NAME`     | Database name         | `audience_checker`      |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:3000` |

### Frontend (.env.local)

| Variable              | Description     | Example                 |
| --------------------- | --------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000` |

## Performance Tips

- Use `npm ci` instead of `npm install` in production for deterministic builds
- Enable caching in CI/CD pipelines
- Use database indexes for frequently queried columns
- Consider implementing pagination for large result sets

## Support

For issues and questions:

1. Check the project documentation
2. Review existing GitHub issues
3. Create a new issue with detailed information

## License

ISC