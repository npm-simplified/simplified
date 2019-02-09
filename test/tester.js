'use strict';

const _ = require('underscore');

require('../lib/load');

const whereClause = clause => {
    let $where = [],
        $filters = [],
        coms = {
            $gt: '> ?',
            $gte: '>= ?',
            $lt: '< ?',
            $lte: '<= ?',
            $not: '!= ?',
            $in: 'IN (?)',
            $notin: 'NOT IN (?)',
            $like: 'LIKE ?',
            $notlike: 'NOT LIKE ?',
            $between: 'BETWEEN ? AND ?'
        };

    let mapCon = cond => {
        let where = [],
            filters = [];

        Object.keys(cond).map( key => {
            let value = cond[key],
                com = false;

            if ( _.isObject(value) ) {
                com = _.first(_.keys(value));
                value = value[com];
            }

            com = coms[com] || '= ?';

            where.push(`\`${key}\` ${com}`);
            filters.push(value);
        });

        if ( where.length ) {
            if ( where.length > 1 ) {
                where = '(' + where.join(' AND ') + ')';
            } else {
                where = where.join(' AND ');
            }
        }

        return {where: where, filters: filters};
    };

    let getWhere = function(cond) {
        let arr = [];

        if ( _.isArray(cond) ) {
            cond.map(mapCon).map( result => {
                arr.push(result.where);
                $filters = $filters.concat(result.filters);
            });
        } else if ( _.isObject(cond) ) {
            Object.keys(cond).map( con => {
                let obj = {};
                obj[con] = cond[con];

                con = mapCon(obj);
                arr.push(con.where);
                $filters = $filters.concat(con.filters);
            });
        }

        return arr;
    };

    _.each( clause, (cond, o) => {
        let found = false;

        switch(o) {
            case '$and' :
                found = true;

                let $and = getWhere(cond);

                if ( ! $and.length ) {
                    break;
                }

                $and = '(' + $and.join(' AND ') + ')';
                $where.push($and);
                break;

            case '$or' :
                found = true;

                let $or = getWhere(cond);

                if ( ! $or.length ) {
                    break;
                }

                $or = '(' + $or.join(' OR ') + ')';
                $where.push($or);

                break;
        }

        if ( ! found ) {
            let obj = {};
            obj[o] = cond;

            let $o = mapCon(obj);

            $where.push($o.where);
            $filters = $filters.concat($o.filters);
        }
    });

    if ( $where.length ) {
        $where = $where.join(' AND ');
    }

    return {where: $where, filters: $filters};
};

let a = whereClause({
    name: {$in: ['irene']},
    age: 20
});

console.log(a);

/**

console.log('$or in array');
whereClause({
    $or: [
        {name: 'irene', age: 20},
        {name: 'daisy', age: 18}
    ]
});

console.log('$or in object');
whereClause({
    $or: {
        name: 'irene',
        age: 20
    }
});

console.log('$and in array');
whereClause({
    $and: [
        {group: 1, level: 2},
        {group: 2, level: 5}
    ]
});

console.log('$and in object');
whereClause({
    $and: {
        group: 1,
        level: 2
    }
});

 **/