// server/logger.js

const { createLogger, format, transports } = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');
const { combine, timestamp, printf } = format;
const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
    node: process.env.ELASTICSEARCH_HOST || 'http://localhost:9200'
});

const esTransportOpts = {
    level: 'info',
    client: esClient,
    indexPrefix: 'log',
    transformer: (logData) => {
        return {
            "@timestamp": new Date().toISOString(),
            "severity": logData.level,
            "message": logData.message,
            "fields": logData.meta,
            "service": "app"
        };
    }
};

const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

const logger = createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        myFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'app.log' }),
        new ElasticsearchTransport(esTransportOpts)
    ]
});

module.exports = logger;
