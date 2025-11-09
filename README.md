# GiftFlow

A self-hosted, modern, and collaborative web application for managing gift ideas, purchases, and reimbursement tracking among a group of members.

## Visual Overview

<table>
  <tr>
    <td align="center" width="50%">
      <h3>Main Dashboard</h3>
      <img src="https://private-user-images.githubusercontent.com/62147746/511783454-7aa5635c-08d3-437c-b4a6-8bdd496e9370.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjI2ODU0OTcsIm5iZiI6MTc2MjY4NTE5NywicGF0aCI6Ii82MjE0Nzc0Ni81MTE3ODM0NTQtN2FhNTYzNWMtMDhkMy00MzdjLWI0YTYtOGJkZDQ5NmU5MzcwLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTExMDklMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUxMTA5VDEwNDYzN1omWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTViMGVmMDE5NGQ1OWMxYmM5ZDljNzI3ZGZlMGZhZGUxMDgxMjhkY2YwYjMzOGM5Y2Q0MWI1ODFmMjEwNTA1ZTAmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.11EIN_S8O52E8G0ZTadyoBAcEsURYed3PWZO9W8Fyvk" alt="GiftFlow Main Dashboard" width="100%" />
    </td>
    <td align="center" width="50%">
      <h3>Detailed View by Person</h3>
      <img src="https://private-user-images.githubusercontent.com/62147746/511783456-a253c094-194a-4229-915a-8e0e4cf1cc63.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjI2ODU0OTcsIm5iZiI6MTc2MjY4NTE5NywicGF0aCI6Ii82MjE0Nzc0Ni81MTE3ODM0NTYtYTI1M2MwOTQtMTk0YS00MjI5LTkxNWEtOGUwZTRjZjFjYzYzLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTExMDklMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUxMTA5VDEwNDYzN1omWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWIzYjQyYzdmM2RjN2VjNWYxZDRlM2FmYjc3ZTE3MmIwZTZkNjNjYTM1OTllOGYzNGI3MWY2NjNlZmVkMmQ2YjkmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.VJh2MZv5nrM35DD-DmfAqT1qtsgeeoJJbYOM6GbZZDs" alt="Detailed gift and idea view for a single person" width="100%" />
    </td>
  </tr>
</table>

---

<table>
  <tr>
    <td align="center" width="50%">
      <h3>Add Idea Form</h3>
      <img src="https://private-user-images.githubusercontent.com/62147746/511783822-facdbc6b-3447-4f19-aedb-9770adb1638f.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjI2ODU3NDUsIm5iZiI6MTc2MjY4NTQ0NSwicGF0aCI6Ii82MjE0Nzc0Ni81MTE3ODM4MjItZmFjZGJjNmItMzQ0Ny00ZjE5LWFlZGItOTc3MGFkYjE2MzhmLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTExMDklMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUxMTA5VDEwNTA0NVomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTgxMWNjYTZlMThlZGJkZGJhNDU4NDFjMjEyNThiN2MzNWIzOTM3ZjA1ZmQxZGFiOWZhYWRhZmZkODYxZGIyYjAmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.STnBImscSaTHkHX5A9iyLFY1BxmxbGH3II4QA-GYpKY" alt="Gift idea submission form" width="100%" />
    </td>
    <td align="center" width="50%">
      <h3>Add Purchase Form</h3>
      <img src="https://private-user-images.githubusercontent.com/62147746/511783457-80c54cdf-fc1d-4323-aad7-cc2082fc73c1.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjI2ODU0OTcsIm5iZiI6MTc2MjY4NTE5NywicGF0aCI6Ii82MjE0Nzc0Ni81MTE3ODM0NTctODBjNTRjZGYtZmMxZC00MzIzLWFhZDctY2MyMDgyZmM3M2MxLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTExMDklMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUxMTA5VDEwNDYzN1omWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTI5MTU2MzZjMmQ0Y2ZkMGVkNTFlMzJiNTUyMzM0YTBjMzgyNDc3YzVjZjAzNTAxOWE4NzJhOGQxNDAyOTBiMzMmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.twpfLw_ubim8C-cY5llJEbRQdcL2WL1WwvWuZqRG5ck" alt="Gift purchase registration form with reimbursement tracking" width="100%" />
    </td>
  </tr>
</table>

---

<table>
  <tr>
    <td align="center" colspan="2">
      <h3>Historical Archive View</h3>
      <img src="https://private-user-images.githubusercontent.com/62147746/511783455-1474dc69-f2b5-41ae-8ca6-041e74b6f82a.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjI2ODU5MDQsIm5iZiI6MTc2MjY4NTYwNCwicGF0aCI6Ii82MjE0Nzc0Ni81MTE3ODM0NTUtMTQ3NGRjNjktZjJiNS00MWFlLThjYTYtMDQxZTc0YjZmODJhLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTExMDklMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUxMTA5VDEwNTMyNFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTYyMTBlYmQ3YTMwNzYzOTkzYzhiNTRkMDhkODRlNTkxZWY3M2IyNWYxNDRmMmM1MDE5NGI2YTJhM2M0YTdlODAmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.3-AytGzlgxcVCOoaAMJdwAkafieYcrjOHjklwSQ8lyc" alt="Archived gifts from previous years" width="100%" />
    </td>
  </tr>
</table>

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
