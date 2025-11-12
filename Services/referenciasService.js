const { where } = require('sequelize');
const { Topico, ReferenciaModulo } = require('../models');
const { getUserByLtik } = require('../Services/userService');
const { verificaModuloAtivoByUser } = require("./moduloService");



async function getReferencias(ltik){
    try {
        if (!ltik) throw new Error('Parâmetro obrigatório ausente!');

        const aluno = await getUserByLtik(ltik);
        console.log('teste')
        const userModulo = await verificaModuloAtivoByUser(aluno);
        console.log("passei")
        const referencias = await ReferenciaModulo.findAll({
            where: {
                modulo_id: userModulo.id_modulo
            }
        })
        console.log(referencias)
        if (!referencias){
            throw new Error('Referências não encontrada!');
        }
        
        return referencias

    } catch (error) {
        throw new Error('Erro ao buscar referencias!')
    }
}

module.exports = { getReferencias }