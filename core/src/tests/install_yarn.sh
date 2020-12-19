set -e
# Install Yarn
curl -o- -L https://yarnpkg.com/install.sh | bash
echo 'export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"' >> $BASH_ENV
# Yarn requires a modern version of Node, >8
source /opt/circleci/.nvm/nvm.sh && nvm install 14.15.3 && nvm use 14.15.3