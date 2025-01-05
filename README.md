# Project Overview

This project is a web application for converting Jupyter Notebook (`.ipynb`) files to LaTeX. Users can upload `.ipynb` files, select specific cells for inclusion, customize the formatting, and download the resulting `.tex` file. The application consists of a frontend built with React and a backend powered by FastAPI.

## Features

- Upload `.ipynb` files.
- Convert Jupyter Notebooks to LaTeX format.
- Customize the output (e.g., select cells, modify formatting).
- Download the generated `.tex` file.

## Prerequisites

To run the application locally, ensure the following are installed:

- Docker
- Docker Compose

## Setup and Deployment

### Clone the Repository

```bash
git clone <repository_url>
cd <repository_name>
```

### Build and Run the Application Using Docker

1. **Build the Docker containers:**

   ```bash
   docker-compose build
   ```

2. **Start the application:**

   ```bash
   docker-compose up
   ```

3. The frontend will be available at `http://localhost:3000`, and the backend API will be accessible at `http://localhost:8000`.

## License

This project is licensed under the MIT License. See the LICENSE file for details.


