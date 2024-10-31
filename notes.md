# Albert's slash take home notes

Here are my notes for Slash's frontend take home.

## Initial considerations

The first question I ask myself is always: **What is the purpose of this project?** In this case, I'm not totally sure about the use case for the transaction page for Slash users, but I can make some general assumptions. Those were as follows:

1. This is a general page to inspect transactions. While the date picker is important, it serves the PURPOSE of being able to more acurately inspect the transactions I want to inspect.
2. There will be a couple of common date range use cases: this month, last month, yesterday, etc. These should be easily accessable.
3. There may be a LOT of transactions. Pagination will be my friend here, and I'll most likely have to modify the existing route.

One interesting challenge was the hard requirement to show daily amounts, or at least an indicator of daily amount, in the calendar view. This presents a latency problem when navigating the calendar.

The second thing I do is look for inspiration. I'm not the first to create a date picker, and won't be the last. My main sources of inspiration were Ramp's transaction page and RocketMoney's transaction page. I also use Mobbin as inspiration

## Optimizations / priority

When making decisions for this project, I loosely followed this priority list:

1. Dev speed. I'm time constrained and if I'm familiar with a technology, it gets points. In production, this would probably come second or lower.
2. UX. What would a user do with this tool? How are they going to use it? Optimize for common use cases and experience.
3. Visual design. As this is (as I understand it) mainly an internal tool, its more important that it works fast and reliably than look amazing.
   This list is in the context of a time-constrained take-home project, mimicing a page for Slash. In production my priorities would likey be slightly different.
4. Code quality. Pretty self explanatory, I need to ship this fast lol.

## Implementation details/tradeoffs

A good starting point was shadcn's range date picker, which proved to be the backbone of my UI. Working with a UI library like shadcn is a lifesaver for speed, and is something I regularly use in production. Shadcn in particular is nice because it's not technically a library - you control all the code by copy/pasting (using their handy cli) components into your project. This makes up for the usual tradeoff of UI libraries being harder to style out of the box.

Once I had a simple date range selector implemented, the first challenge was filtering/pagination. There were way too many transactions to simply load all of them, then filter them by range on the frontend. I changed the route to accept a date range and explicit page pagination.

The next challenge was the `visual indication of the amount spent for each day` requirement. Since my date picker was a 2 month view, I'd have to load all the transactions in those 2 months, aggregate them by day, sum up the amounts, and display them. I tried this but it was incredibly slow, espectially when navigating month to month. To fix, I created a new route called `daily-totals`, which simply took a `month` and `year` and returned the amount for each day. This optimization moves the grunt work of counting, aggregating and summing to the SQL query. We simply get back a map of `day -> (totalAmount, transactionCount)`.

Even after this route, navigating between months was still slow. An additional optimization was prefetching the previous and next month to be displayed in the calendar view. I used `@tanstack/react-query` to create all my data fetching hooks. I considered using `swr`, but `@tanstack/react-query` is much more feature rich and included prefetching. Also frankly I'm super familiar with it. After implementing prefetching, navigating between months became fast since it was reading from the prefetched cache, and loading more in the background.

Since this is a wholistic transaction page, it felt incomplete without other filters. I added the merchant and amount range filters, which included changing the backend route to filter for these as well. Pretty simple, but made the page feel much more complete.

Here are also small things that enhaced the UX:

- Filters in the URL params, so that on refresh the page doesn't reset. You can also visit this link from elsewhere and the filters will work.
- Export CSV. I assume this is what people will actually want to "do" with this page.
- Minimal UI jumping. I aimed to minimize the amount of "jumping/jittering" on the ui. I use skeleton loading states and good defaults default sizes to accomplish this.
- No animations. I enjoy a snappy tool and I suspect someone who is using this page often would too.
- Responsive. The page and components are responsive. It's not optimized for mobile but it will work.
- Slash logo. Just for fun

## What I would do if I had more time

This would be in order of what I think would be important. 4 and 5 are very on the fence, but worth mentioning.

1. Create a **summary** block, where I display the information most people want to see at a glance (total transaction amount, most frequent vendor).
2. Change the table view. I literally barely touched the table view - I thought it looked decent as is - but it could definitely use a facelift. I prioritized other things over making it look nice (additional filters)
3. Improve filtering functionality. Multiple merchants, grouped merchants (like RocketMoney), status are all additional filters I'd add.
4. Add a full calendar view. Like a full-page, google-calendar esque view. I'd only do this if it turns out people were really interested in day by day, week by week breakdowns. My hunch is that they aren't.
5. Optimize for mobile. It works on mobile right now (the components are responsive) but it's certainly not optimized for mobile. I suspect that +95% of traffic to a page like this is from desktop, so this ranks quite low.
