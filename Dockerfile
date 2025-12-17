FROM python:3.11-alpine

WORKDIR /app

COPY . /app

ENV HOMEDOCK_DATA_DIR=/data

VOLUME ["/data"]

EXPOSE 8000

CMD ["python", "dev-server.py", "--port", "8000"]
