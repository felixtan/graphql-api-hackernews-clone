import { objectType, extendType, nonNull, stringArg, intArg, inputObjectType, enumType, arg, list } from "nexus";
import { Prisma } from '@prisma/client';

export const Link = objectType({
  name: "Link",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.string("description");
    t.nonNull.dateTime('createdAt');
    t.nonNull.string('url');
    t.field('postedBy', {
      type: 'User',
      resolve(parent, args, context) {
        return context.prisma.link
          .findUnique({ where: { id: parent.id }})
          .postedBy()
      }
    });
    t.nonNull.list.nonNull.field('voters', {
      type: 'User',
      resolve(parent, args, context) {
        return context.prisma.link
          .findUnique({ where: { id: parent.id }})
          .voters();
      }
    })
  }
})

// extend Query root type adding "feed" field
export const LinkQuery = extendType({
  type: 'Query',
  definition(t) {
    // query must return non-null array of Link objects
    t.nonNull.list.nonNull.field('feed', {
      type: 'Feed',
      args: {
        filter: stringArg(),
        skip: intArg(),
        take: intArg(),
        orderBy: arg({ type: list(nonNull(LinkOrderByInput)) }),
      },
      // resolver function
      async resolve(parent, args, context, info) {
        const where = args.filter
          ? {
              OR: [
                { description: { contains: args.filter }},
                { url: { contains: args.filter }},
              ],
            }
          : {};

        const links = await context.prisma.link.findMany({
          where,
          skip: args?.skip as number | undefined,
          take: args?.take as number | undefined,
          orderBy: args?.orderBy as Prisma.Enumerable<Prisma.LinkOrderByWithRelationInput> | undefined,
        });

        const count = await context.prisma.link.count({ where });
        const id = `main-feed:${JSON.stringify(args)}`;

        return { links, count, id };
      }
    })
  }
})

// add new root field to the Mutation type
export const LinkMutation = extendType({
  type: 'Mutation',
  definition(t) {
    // named post, return non-null Link obj
    t.nonNull.field('post', {
      type: 'Link',
      args: {
        description: nonNull(stringArg()),
        url: nonNull(stringArg()),
      },
      resolve(parent, args, context) {
        const { description, url } = args;
        const { userId } = context;

        if (!userId) {
          throw new Error('Cannot post without logging in.')
        }

        const newLink = context.prisma.link.create({
          data: {
            description,
            url,
            postedBy: { connect: { id: userId }},
          }
        });
        return newLink;
      }
    })
  }
});

export const LinkOrderByInput = inputObjectType({
  name: 'LinkOrderByInput',
  definition(t) {
    t.field('description', { type: Sort });
    t.field('url', { type: Sort });
    t.field('createdAt', { type: Sort });
  },
})

export const Sort = enumType({
  name: 'Sort',
  members: ['asc', 'desc']
})

export const Feed = objectType({
  name: 'Feed',
  definition(t) {
    t.nonNull.list.nonNull.field('links', { type: Link });
    t.nonNull.int('count');
    t.id('id');
  },
})