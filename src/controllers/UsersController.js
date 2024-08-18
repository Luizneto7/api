const { hash, compare } = require("bcryptjs");
const sqliteConnection = require("../database/sqlite");
const AppError = require("../utils/AppError");

class UsersController {
    async create (req, res) {
        const { name, email, password } = req.body;

        const database = await sqliteConnection();
        const userAlreadyExists = await database.get("SELECT * FROM users WHERE email = (?)", [ email ]);

        if(userAlreadyExists) { 
            throw new AppError("This e-mail is been already used.");
        }

        const hashedPassword = await hash(password, 8);

        await database.run(`
            INSERT INTO users
            (name, email, password)
            VALUES
            (?, ?, ?)`,
            [ name, email.toLowerCase(), hashedPassword ]
        );

        return res.status(200).json({
            status: "User successfully created.",
            name,
            email,
            password
        });
    }

    async update (req, res) {
        const { name, email, password, old_password } = req.body;
        const { id } = req.params;

        const database = await sqliteConnection();
        const user = await database.get("SELECT * FROM users WHERE id = (?)", [ id ]);

        if(!user) {
            throw new AppError("User not found.");
        }

        const userWithUpdatedEmail = await database.get("SELECT * FROM users WHERE email = (?)", [ email ]);

        if(userWithUpdatedEmail && userWithUpdatedEmail.id !== user.id) {
            throw new AppError("This email is been already used.");
        }

        user.name = name ?? user.name;
        user.email = email ?? user.email;

        if(password && !old_password) {
            throw new AppError("Old password is necessary to proceed.");
        }

        if(password && old_password) {
            const checkOldPassword = await compare(old_password, user.password);

            if(!checkOldPassword) {
                throw new AppError("Old password incorrect.");
            }

            user.password = await hash(password, 8); 
        }

        await database.run(` 
            UPDATE users SET
            name = ?,
            email = ?,
            password = ?,
            updated_at = DATETIME('now')
            WHERE id = (?)`,
            [ user.name, user.email, user.password, id ]
        );

        return res.status(200).json({
            status: "User sucessfully updated."
        });
    }

    async delete( req, res) {
        const { id } = req.params;

       const database = await sqliteConnection();
       const user = await database.get("SELECT * FROM users WHERE id = (?)", [ id ]);

       if(!user){
        throw new AppError("User not found.");
       }

       await database.run(`
            DELETE FROM users
            WHERE id = (?)`,
            [ id ]
        );

        return res.status(200).json({
            status: "User successfully deleted."
        });
    }
}

module.exports = UsersController;