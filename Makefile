install:
	cd fe && npm install
start-frontend:install
	cd fe && npm run dev
start-backend:
	cd be && npm run dev
start:
	make start-frontend 