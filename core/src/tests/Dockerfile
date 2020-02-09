FROM ubuntu:18.04
# Change default shell from Dash to Bash
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt-get update && apt-get install -y \
    bzip2 \
    ca-certificates \
    curl \
    xvfb \
    git \
    gnupg \
    gzip \
    jq \
    locales \
    mercurial \
    net-tools \
    netcat \
    openssh-client \
    parallel \
    sudo \
    tar \
    unzip \
    wget \
    zip
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
RUN sudo apt update && sudo apt install -y yarn