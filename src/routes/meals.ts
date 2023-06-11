/* eslint-disable camelcase */
import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-user-id-exists'
import { z } from 'zod'
import { randomUUID } from 'crypto'

export async function dietRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: checkSessionIdExists,
    },
    async (request, response) => {
      const { sessionId } = request.cookies

      const user = await knex('users').where('session_id', sessionId).first()

      if (!user) {
        return response.status(404).send({
          error: 'User not found.',
        })
      }

      const meals = await knex('meals').where('user_id', user.id).select()

      if (!meals) {
        return response.status(404).send({
          error: "Can't found list of meals.",
        })
      }

      return { meals }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: checkSessionIdExists,
    },
    async (request, response) => {
      const getMealParamSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamSchema.parse(request.params)

      const meal = await knex('meals').where('id', id).first()

      if (!meal) {
        return response.status(404).send({
          error: 'Meal not found.',
        })
      }

      return { meal }
    },
  )

  app.post(
    '/',
    { preHandler: checkSessionIdExists },
    async (request, response) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        date: z
          .string()
          .min(10)
          .includes('-', { message: 'Date format must be YYYY-MM-DD.' }),
        time: z
          .string()
          .min(5)
          .includes(':', { message: 'Time format must be HH:mm.' }),
        is_on_diet: z.boolean(),
      })
      const { name, description, date, time, is_on_diet } =
        createMealBodySchema.parse(request.body)

      const { sessionId } = request.cookies

      const user = await knex('users').where('session_id', sessionId).first()

      if (!user) {
        return response.status(404).send({
          error: 'User not found.',
        })
      }

      await knex('meals').insert({
        id: randomUUID(),
        user_id: user?.id,
        name,
        description,
        date,
        time,
        is_on_diet,
      })

      return response.status(201).send()
    },
  )

  app.put(
    '/:id',
    { preHandler: checkSessionIdExists },
    async (request, response) => {
      const getMealParamSchema = z.object({
        id: z.string().uuid(),
      })

      const createMealBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        date: z
          .string()
          .min(10)
          .includes('-', { message: 'Date format must be YYYY-MM-DD.' })
          .optional(),
        time: z
          .string()
          .min(5)
          .includes(':', { message: 'Time format must be HH:mm.' })
          .optional(),
        is_on_diet: z.boolean().optional(),
      })
      const { id } = getMealParamSchema.parse(request.params)

      const { name, description, date, time, is_on_diet } =
        createMealBodySchema.parse(request.body)

      const meal = await knex('meals').where('id', id).first()

      if (!meal) {
        return response.status(404).send({
          error: 'Meal not found.',
        })
      }

      await knex('meals').where('id', id).update({
        name,
        description,
        date,
        time,
        is_on_diet,
      })
      return response.status(204).send()
    },
  )

  app.delete(
    '/:id',
    { preHandler: checkSessionIdExists },
    async (request, response) => {
      const getMealParamSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamSchema.parse(request.params)

      const meal = await knex('meals').where('id', id).first()

      if (!meal) {
        return response.status(404).send({
          error: 'Meal not found.',
        })
      }

      await knex('meals').where('id', id).delete()
      return response.status(200).send()
    },
  )
}
