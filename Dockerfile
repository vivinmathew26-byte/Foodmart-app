FROM nginx:alpine
COPY Index.html /usr/share/nginx/html/index.html
COPY order.html /usr/share/nginx/html/order.html
COPY style.css  /usr/share/nginx/html/style.css
COPY script.js  /usr/share/nginx/html/script.js
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
