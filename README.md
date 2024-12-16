# SyncLab: Where Developers Converge! 🚀

Collaborate in real-time with integrated coding, whiteboard brainstorming, and seamless file sharing. Elevate your coding interviews and team projects in a dedicated space designed for developers. Join us in building the future of developer collaboration!

## Features
- **Real-time Collaboration:** Work on projects with your team in real-time, complete with an interactive coding environment.
- **Whiteboard Integration:** Brainstorm ideas visually with an integrated whiteboard feature.
- **File Sharing:** Seamlessly upload, download, and share files within your project.
- **Dedicated Spaces:** Create rooms for focused collaboration with dynamic configurations tailored for developers.
- **Developer Interviews:** A perfect platform for conducting and participating in technical interviews.

## System Design
![System Design Diagram](https://github.com/user-attachments/assets/48a57a6c-9f77-4f5d-84fb-b42d2081b202)

## Getting Started

### Prerequisites
1. **Node.js**: Install the latest LTS version of Node.js from [Node.js Official Website](https://nodejs.org/).
2. **Docker**: Ensure Docker is installed and running on your system. Follow the installation guide on [Docker's Website](https://www.docker.com/).
3. **Redis**: Redis should be installed and running. Use [Redis Installation Guide](https://redis.io/docs/getting-started/).
4. **PostgreSQL**: Install and configure PostgreSQL for database management. Visit [PostgreSQL Downloads](https://www.postgresql.org/download/).

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sikehish/SyncLab.git
cd SyncLab
```

2. Install dependencies for both frontend and backend:
```bash
cd frontend
npm install
cd ../backend
npm install
```

3. Set up environment variables:
   - Rename `.env.template` to `.env` and `.env.local.template` to `.env.local`.
   - Fill in the required values as per the following:


### Running the Application

1. Start Redis and PostgreSQL services.
2. Start the frontend and backend servers:
```bash
# In the frontend directory
cd frontend
npm start

# In the backend directory
cd ../backend
npm run dev
```
3. Open your browser and navigate to:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:5000`


## Technologies Used
- **Frontend**: React.js, Tailwind CSS
- **Backend**: Node.js, Express, Docker
- **Database**: PostgreSQL, Redis
- **Authentication**: Clerk for user authentication
- **Realtime Communication**: Agora SDK

## Contributing
We welcome contributions from the community! Feel free to fork the repository and submit a pull request with your changes.

## License
This project is licensed under a custom license. See the `LICENSE` file for details.

