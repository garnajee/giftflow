# GiftFlow

A self-hosted, modern, mobile-friendly web application for managing gift ideas, purchases, and reimbursement tracking among a group of members.

## Visual Overview

<table>
  <tr>
    <td align="center" width="50%">
      <h3>Main Dashboard</h3>
      <img src="https://github.com/user-attachments/assets/7aa5635c-08d3-437c-b4a6-8bdd496e9370" alt="GiftFlow Main Dashboard" width="100%" />
    </td>
    <td align="center" width="50%">
      <h3>Detailed View by Person</h3>
      <img src="https://github.com/user-attachments/assets/a253c094-194a-4229-915a-8e0e4cf1cc63" alt="Detailed gift and idea view for a single person" width="100%" />
    </td>
  </tr>
</table>

---

<table>
  <tr>
    <td align="center" width="50%">
      <h3>Add Idea Form</h3>
      <img src="https://github.com/user-attachments/assets/facdbc6b-3447-4f19-aedb-9770adb1638f" alt="Gift idea submission form" width="100%" />
    </td>
    <td align="center" width="50%">
      <h3>Add Purchase Form</h3>
      <img src="https://github.com/user-attachments/assets/80c54cdf-fc1d-4323-aad7-cc2082fc73c1" alt="Gift purchase registration form with reimbursement tracking" width="100%" />
    </td>
  </tr>
</table>

---

<table>
  <tr>
    <td align="center" colspan="2">
      <h3>Historical Archive View 1</h3>
      <img src="https://github.com/user-attachments/assets/1474dc69-f2b5-41ae-8ca6-041e74b6f82a" alt="Archived gifts from previous years" width="70%" />
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <h3>Historical Archive View 2</h3>
      <img src="https://github.com/user-attachments/assets/c4ca75db-9a99-4857-9da1-82642678d404" alt="Gift purchase registration form with reimbursement tracking" width="100%" />
    </td>
    <td align="center" width="50%">
      <h3>Historical Archive View 3</h3>
      <img src="https://github.com/user-attachments/assets/2a7f7b8a-f204-44ad-9195-c4f4e1d59c10" alt="Gift purchase registration form with reimbursement tracking" width="100%" />
    </td>
  </tr>
</table>

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Deployment](#installation--deployment)
  - [Docker Setup](#docker-setup)
- [Project Structure](#project-structure)
- [API Usage & Endpoints](#api-usage--endpoints)
  - [Authentication](#authentication)
  - [Example Requests](#example-requests)
  - [Endpoint List](#endpoint-list)
- [License](#license)

## Overview

GiftFlow solves the common problem of coordinating gifts for family members or friends. It provides a centralized platform to list gift ideas, convert them into actual purchases, and transparently manage shared costs and debts. The application is designed to be simple, intuitive, and fully responsive, with a focus on a clean user experience.

The entire application is containerized with Docker, making deployment and management straightforward.

## Key Features

-   **Collaborative Idea Management**: Any member can add gift ideas for any other member.
-   **Purchase Tracking**: Convert an idea into a purchased gift, tracking price, store, date, and payer.
-   **Reimbursement System**: Clearly define which members are participating in a group gift and track reimbursement statuses (Unpaid, Partial, Fully Paid).
-   **Full CRUD Operations**: Create, Read, Update, and Delete both ideas and purchased gifts.
-   **Historical Archives**: Gifts from previous years are automatically archived and can be browsed by year and by person.
-   **Multi-language Support (i18n)**: The interface is translated using JSON files, with the default language configurable at deployment. (Currently supports English & French).
-   **Secure by Default**: API endpoints are protected by Basic Authentication.
-   **Responsive Design**: A mobile-first approach ensures a seamless experience on any device.
-   **Self-Hosted & Private**: Your data stays on your server.

## Tech Stack

-   **Frontend**:
    -   HTML
    -   CSS
    -   JS
-   **Backend**:
    -   Node.js
    -   Express.js
-   **Infrastructure & Deployment**:
    -   Docker & Docker Compose
    -   Nginx (as a web server and reverse proxy)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have Docker and Docker Compose installed on your machine.

### Installation & Deployment

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/garnajee/giftflow.git
    cd giftflow
    ```

2.  **Configure Members & Data (Optional):**
    -   Edit `data/users.json` to define the list of members, their usernames, and passwords.
    -   The `data/database.json` file contains gift ideas and purchases. You can start with the provided sample data or clear the arrays to start fresh.

3.  **Configure Default Language (Optional):**
    -   Open the `docker-compose.yml` file.
    -   Change the `DEFAULT_LANG` environment variable to your preferred default language (`fr` or `en`).
    ```yaml
    environment:
      - DEFAULT_LANG=en
    ```

4.  **Build and run the application:**
    ```bash
    docker-compose up --build -d
    ```
    This command builds the Docker images for the API and the Nginx frontend, then starts both services in detached mode.

5.  **Access the application:**
    Open your web browser and navigate to `http://localhost:8080`.

6.  **Stopping the application:**
    To stop the running containers, execute:
    ```bash
    docker-compose down
    ```

### Docker Setup

Since GiftFlow images are built automatically via GitHub Actions, you don't need to clone the entire code to deploy it. You only need the `docker-compose.yml` file.

### 1. Prepare Data Persistence
Before starting the containers, you **must** create the data directory and initialize the JSON files with valid structures.

```bash
mkdir giftflow
cd giftflow
mkdir data

# Create initial users file (Replace credentials!)
echo '{
  "members": [
    { "id": 1, "username": "Admin", "password": "changeMe", "isAdmin": true }
  ]
}' > data/users.json

# Create empty database structure
echo '{
  "families": [],
  "userFamilyLinks": [],
  "giftIdeas": [],
  "purchasedGifts": [],
  "reimbursementStatus": []
}' > data/database.json
```

Run:

Start the application:

```bash
docker-compose up -d
```


## Project Structure

```
.
├── backend/
│   ├── Dockerfile          # Instructions to build the Node.js API image
│   ├── package.json
│   └── server.js           # The Express API server
├── data/
│   ├── database.json       # Stores gifts and ideas (persistent via volume)
│   └── users.json          # Stores members and credentials (persistent via volume)
├── locales/
│   ├── en.json             # English translation file
│   └── fr.json             # French translation file
├── Dockerfile              # Instructions to build the Nginx frontend image
├── docker-compose.yml      # Orchestrates the api and nginx services
├── entrypoint.sh           # Script to inject environment variables at runtime
├── index.html
├── nginx.conf
├── app.js
└── style.css
```

## API Usage & Endpoints

### Authentication

All endpoints under `/api/` are protected using **HTTP Basic Authentication**. You must provide valid user credentials (defined in `data/users.json`) with every request.

The frontend application handles this automatically after a successful login. For direct API interaction (e.g., with `curl`), you need to include the credentials.

### Example Requests

Here are some examples using `curl`. Replace `Alice:alice` with valid credentials from your `users.json` file.

**1. Get All Data (GET)**
```bash
curl -u "Alice:alice" http://localhost:8080/api/data
```

**2. Add a New Gift Idea (POST)**
```bash
curl -u "Alice:alice" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "title": "A good book",
    "estimatedPrice": 25,
    "targetMemberId": 2,
    "creatorId": 1
  }' \
  http://localhost:8080/api/ideas
```

**3. Delete a Purchased Gift (DELETE)**
```bash
curl -u "Alice:alice" -X DELETE http://localhost:8080/api/gifts/201
```

### Endpoint List

-   `GET /api/data`: Fetches all application data.
-   `POST /api/ideas`: Creates a new gift idea.
-   `PUT /api/ideas/:id`: Updates an existing gift idea.
-   `DELETE /api/ideas/:id`: Deletes a gift idea.
-   `POST /api/gifts`: Creates a new purchased gift.
-   `PUT /api/gifts/:id`: Updates an existing purchased gift.
-   `DELETE /api/gifts/:id`: Deletes a purchased gift and its associated reimbursements.
-   `POST /api/gifts/:id/revert-to-idea`: Converts a purchased gift back into an idea.
-   `PUT /api/status/:id`: Updates a specific reimbursement status.

## License

This project is licensed under the [MIT](LICENSE) License.
