const { createLogger, transports, format } = require('winston');

const customerLogs = createLogger({
    transports: [
        new transports.Console(
            {
                format: format.combine(
                    format.timestamp(),
                    format.label({ label: "node-express-api" }),
                    format.printf(({ level, message, label, timestamp }) => {
                        return `[${label}] ${message} ${timestamp}`;
                    }),
                    format.json(),
                ),
                    level:'info',
            }
        ),
        // new transports.File({
        //     filename : './logs/user.log',
        //     level : 'info',
        //     format : format.combine(format.timestamp(),format.json())
        // }),
        // new transports.File({
        //     filename:'./logs/user_error.log',
        //     level : 'error',
        //     format : format.combine(format.timestamp(),format.json())
        // })
    ]
});
module.exports = { customerLogs };
