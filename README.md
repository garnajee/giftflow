# GiftFlow

A self-hosted, modern, and collaborative web application for managing gift ideas, purchases, and reimbursement tracking among a group of members.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
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
      - DEFAULT_LANG=fr
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

## API Endpoints

The backend provides the following RESTful endpoints:

-   `GET /api/data`: Fetches all application data (members, ideas, gifts, statuses).
-   `POST /api/ideas`: Creates a new gift idea.
-   `PUT /api/ideas/:id`: Updates an existing gift idea (e.g., its price).
-   `DELETE /api/ideas/:id`: Deletes a gift idea.
-   `POST /api/gifts`: Creates a new purchased gift.
-   `PUT /api/gifts/:id`: Updates an existing purchased gift.
-   `DELETE /api/gifts/:id`: Deletes a purchased gift and its associated reimbursements.
-   `POST /api/gifts/:id/revert-to-idea`: Converts a purchased gift back into an idea.
-   `PUT /api/status/:id`: Updates a specific reimbursement status.

## License

This project is licensed under the [MIT](LICENSE) License.
