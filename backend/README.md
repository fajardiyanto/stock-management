# Dashboard Backend API

## Setup

1. Install Go dependencies:

```bash
go mod download
```

2. Create `.env` file with your configuration (see `.env` file)

3. Run the server:

```bash
go run main.go
```

## Default Test Users

Email: admin@example.com
Password: password123

Email: user@example.com
Password: password123

## API Endpoints

### Public Endpoints

**POST /api/login**

- Request body: `{"email": "user@example.com", "password": "password123"}`
- Response: `{"token": "jwt-token", "user": {...}}`

### Protected Endpoints (require JWT token)

**GET /api/user/profile**

- Headers: `Authorization: Bearer <token>`
- Response: `{"id": 1, "name": "User Name", "email": "user@example.com"}`

## Generate Password Hash

To generate a bcrypt hash for new passwords:

```go
package main

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	password := "your-password"
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), 10)
	fmt.Println(string(hash))
}
```
