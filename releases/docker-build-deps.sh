# Create a new builder instance that supports multi-platform
docker buildx create --name mybuilder --driver docker-container --use

# Start the builder
docker buildx inspect --bootstrap
