const knex = require("../database/knex");
const AppError = require("../utils/AppError");

class NotesController {
    async create(req, res) {
        const { title, description, tags, links } = req.body;
        const { user_id } = req.params;

        if(!user_id) {
            throw new AppError('User not found')
        }

        const [ note_id ] = await knex("notes").insert({
            title, 
            description,
            user_id
        });

        const linksInsert = links.map(link => {
            return {
                note_id,
                url: link
            }
        });

        await knex("links").insert(linksInsert);

        const tagsInsert = tags.map(name => {
            return {
                note_id,
                name,
                user_id
            }
        });

        await knex("tags").insert(tagsInsert);

        res.status(200).json({
            status: "Note successfully created."
        });
    }

    async show(req, res) {
        const { id } = req.params;

        const note = await knex("notes").where({ id });
        const tags = await knex("tags").where({ note_id: id });
        const links = await knex("links").where({ note_id: id });

        res.status(200).json({
            ...note,
            tags,
            links
        });
    }

    async delete(req, res) {
        const { id } = req.params;

        await knex("notes").where({ id }).delete();

        res.status(200).json({
            status: `Note N° ${ id } successfully deleted.`  
        });

    }

    async index(req, res) {
        const { user_id, title } = req.query;

        const notes = await knex("notes").where({ user_id }).whereLike(`%${title}%`).orderBy("title");

        return res.json(notes);
    }
}

module.exports = NotesController;