const knexQueryBuilder = require('knex/lib/query/builder');

knexQueryBuilder.prototype.paging = async function (page, page_size) {
    //region [validation]

    if (!page)
        throw {code: 'page_missing'};
    else if (typeof page !== 'number')
        throw {code: 'page_invalid'};

    if (!page_size)
        throw {code: 'page_size_missing'};
    else if (typeof page_size !== 'number')
        throw {code: 'page_size_invalid'};

    //endregion

    let countQuery = this.clone().clearSelect();
    let total = (await countQuery.count())[0]['count(*)'];
    if (total === 0)
        return {total: 0, items: []};

    return {total, items: await this.offset((page - 1) * page_size).limit(page_size)};
};

knexQueryBuilder.prototype.calcShippingData = function ({currentUserLat, currentUserLng, col_store_id, filter_by_shipping_limit_duration, shipping_limit_duration}) {
    this.select(this.client.raw(`calc_shipping_distance(${currentUserLat}, ${currentUserLng}, ${col_store_id}) as shipping_distance`));
    this.select(this.client.raw(`calc_shipping_duration(${currentUserLat}, ${currentUserLng}, ${col_store_id}) as shipping_duration`));

    if (filter_by_shipping_limit_duration)
        this.whereRaw(`calc_shipping_duration(${currentUserLat}, ${currentUserLng}, ${col_store_id}) <= ${shipping_limit_duration}`);

    this.orderByRaw(`calc_shipping_duration(${currentUserLat}, ${currentUserLng}, ${col_store_id}) asc`);

    return this;
};

knexQueryBuilder.prototype.insertWithUuid = async function ({generator, values, max_try_count = 10}) {
    let uuid, try_count = 0;
    do {
        uuid = await generator();
        try_count += 1;

        try {
            await this.insert(values(uuid));
        } catch (e) {
            if (e.code !== 'ER_DUP_ENTRY')
                throw e;

            uuid = undefined;
        }
    } while (!uuid && try_count < max_try_count);

    if (!uuid)
        throw {code: 'new_uuid_not_found'};

    return uuid;
};

knexQueryBuilder.prototype.sort = function (listSort) {
    for (let sort of listSort) {
        if (sort.raw)
            this.orderByRaw(sort.raw);
        else
            this.orderBy(sort.col, sort.order);
    }

    return this;
};

module.exports = knexQueryBuilder;