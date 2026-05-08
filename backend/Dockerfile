FROM python:3.10-alpine

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install dependencies
RUN apk update \
    && apk add --no-cache postgresql-dev gcc python3-dev musl-dev jpeg-dev zlib-dev \
    && pip install --upgrade pip

# Install python packages
COPY ./requirements.txt /app/requirements.txt
RUN pip install -r requirements.txt

# Copy project
COPY . /app/

# Running as root for MVP to avoid local volume permission issues
