# Cross-Border Payment Fee Optimizer

A full-stack web application that provides accurate, corridor-specific comparisons of international money transfer costs across global banks and fintech providers. Now with user authentication and transfer history tracking!

## Features

- **User Authentication**: Secure registration and login system
- **Transfer Cost Analysis**: Compare costs across multiple providers
- **Transfer History**: Track all your previous analyses
- **Real-time Data**: Live exchange rates and provider-specific margins
- **Smart Recommendations**: AI-powered provider suggestions
- **Visual Analytics**: Interactive charts and cost breakdowns

## Tech Stack

### Frontend
- Next.js 15.5.2 with React 19.1.0
- TypeScript for type safety
- Tailwind CSS for styling
- Radix UI components
- Chart.js for data visualization

### Backend
- FastAPI (Python)
- MongoDB with PyMongo
- JWT authentication
- Password hashing with bcrypt
- Pandas for data processing

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- MongoDB (local installation or MongoDB Atlas)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file in the backend directory:
```bash
# MongoDB Connection String
MONGO_URI=mongodb://localhost:27017/payment_optimizer

# JWT Secret Key (generate a secure random string)
SECRET_KEY=your-super-secret-jwt-key-here

# Exchange Rate API Key (optional)
EXCHANGE_RATE_API_KEY=your-api-key-here
```

6. Load the World Bank data:
```bash
python load_data_v2.py
```

7. Start the backend server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Transfer Analysis
- `GET /api/countries` - Get available sending countries
- `GET /api/destinations/{source_country}` - Get destination countries
- `POST /api/transfer/analyze` - Analyze transfer costs (requires auth)
- `GET /api/transfer/history` - Get user's transfer history (requires auth)

## Usage

1. **Register/Login**: Create an account or sign in to access the application
2. **Select Countries**: Choose your source and destination countries
3. **Enter Amount**: Specify the transfer amount
4. **Analyze Costs**: Get detailed cost breakdowns across providers
5. **View History**: Access your previous transfer analyses
6. **Track Savings**: See how much you can save with different providers

## Data Sources

- **Primary**: World Bank Remittance Prices Worldwide (RPW) dataset
- **Coverage**: 48 sending countries, 105 receiving countries, 367 global corridors
- **Live Rates**: Exchange Rate API integration for real-time exchange rates

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Secure token storage
- Protected API endpoints
- CORS configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
