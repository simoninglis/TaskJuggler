FROM ruby:3.1-slim
RUN apt-get update && apt-get install -y git
WORKDIR /app
COPY . .
RUN gem build taskjuggler.gemspec && gem install taskjuggler-*.gem
ENTRYPOINT ["tj3"]
