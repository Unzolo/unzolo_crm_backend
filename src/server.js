const app = require('./app');
const config = require('./config/env');
const sequelize = require('./config/db');



// Sync Database
// Note: In production, use migrations instead of { alter: true }
const syncDb = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');
        await sequelize.sync({ alter: true }); // Using alter to auto-update schema for development
        console.log('Database synced...');
    } catch (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }
};

const startServer = async () => {
    await syncDb();
    app.listen(config.port, () => {
        console.log(`Server running on port ${config.port} in ${config.env} mode`);
    });
};

startServer();
