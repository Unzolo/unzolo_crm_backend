# Travel Partner CRM Backend

## Folder Structure Explanation

This project follows a service-oriented architecture (SOA) adapted for a Node.js/Express monolith.

- **`src/app.js` & `src/server.js`**: Separation of the Express app definition and the server startup logic (DB connection, port listening). This makes testing easier (you can import `app` without starting the server).
- **`src/config/`**: Centralized configuration to keep secrets and environment-specific logic out of the codebase.
- **`src/models/`**: Sequelize models define the database schema. `index.js` handles associations, preventing circular dependency issues.
- **`src/routes/`**: Routes are separated by feature (auth, trip, booking). This keeps `src/routes.js` clean as a main entry point.
- **`src/controllers/`**: Handles the incoming HTTP request, extracts data, calls the Service, and formats the HTTP response. It does *not* contain business logic.
- **`src/services/`**: Contains the business logic (database queries, calculations). This makes logic reusable and easier to test.
- **`src/validations/`**: Joi schemas for request validation. Keeps controllers clean from validation logic.
- **`src/middlewares/`**: Reusable middlewares for authentication, error handling, and request validation.
- **`src/utils/`**: Helper functions (JWT, standard response format) that are used across the app.

## Frontend Integration (Next.js)

1.  **Authentication**:
    *   **Login/Register**: Call `POST /api/auth/login`. Store the returned `token` in a Secure Cookie or LocalStorage.
    *   **Protected Requests**: Attach the token in the `Authorization` header for all future requests:
        ```javascript
        headers: {
          'Authorization': `Bearer ${token}`
        }
        ```
    *   **Redirects**: Use Next.js Middleware to check for the token cookie and redirect to `/login` if missing.

2.  **Data Fetching**:
    *   Use libraries like **Axios** (with an interceptor to add the token automatically) or **TanStack Query** (React Query) for caching and state management.
    *   **Dashboard**: Call `GET /api/dashboard/stats` to populate the partner's home screen.

## Extensibility Guide

1.  **Adding a New Feature (e.g., Reviews)**:
    *   **Model**: Create `src/models/Review.js`. Add associations in `src/models/index.js`.
    *   **Validation**: Create `src/validations/review.validation.js`.
    *   **Service**: Create `src/services/review.service.js` with CRUD logic.
    *   **Controller**: Create `src/controllers/review.controller.js`.
    *   **Route**: Create `src/routes/review.routes.js`, register it in `src/routes.js`.

2.  **Scaling**:
    *   **Database**: The folder structure supports adding migrations (`sequelize-cli`) easily later.
    *   **Testing**: logic is isolated in `services`, making unit testing with Jest straightforward.
    *   **Microservices**: If a specific module (e.g., Bookings) grows too large, the Service/Controller pattern makes it easy to extract into a separate microservice.

3.  **Payment Gateway**:
    *   Add a new service `payment.service.js` to handle Stripe/Razorpay logic.
    *   Update `booking.controller.js` to call `payment.service.js` after verifying availability.
