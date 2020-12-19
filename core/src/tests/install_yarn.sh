set -e
# Install Yarn
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update && sudo apt install --no-install-recommends yarn
# Yarn requires a modern version of Node, >8
source /opt/circleci/.nvm/nvm.sh && nvm install 13.5.0 && nvm use 13.5.0
# Make Yarn available to bash
echo 'export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"' >> $BASH_ENV