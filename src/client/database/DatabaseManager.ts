import * as mysql from 'mysql';
import { SQL_SEARCH_REGEX, SQLQueryTypes } from '../../util/Constants';
const hasOwnProperty = (obj: object, prop: string) => Object.prototype.hasOwnProperty.call(obj, prop);

export default class DatabaseManager {
	private _mysqlConnection: mysql.Connection;

	constructor(config: mysql.ConnectionConfig) {
		this._mysqlConnection = mysql.createConnection(config);
	}

	public static formatInsert(table: string, data: SQLValues) {
		const keys = Object.keys(data);
		return `INSERT INTO ${table}(${keys.join(', ')}) VALUES(${keys.map(
			key => mysql.escape(data[key])
		).join(', ')})`;
	}

	public static format(sql: string, values: SQLValues<SQLValues>) {
		return sql.replace(SQL_SEARCH_REGEX, (text, key) => {
			if (hasOwnProperty(values, key) && values[key] !== undefined) {
				return mysql.escape(values[key]);
			}
			return text;
		});
	}

	public query(sql: SQLQueryTypes.INSERT, table: string, values: SQLValues): Promise<mysql.OkPacket>;
	public query<T = mysql.OkPacket>(
		sql: string,
		values: SQLValues<SQLValues>,
		skipFormat?: boolean
	): Promise<T extends mysql.OkPacket ? mysql.OkPacket : T[]>
	public query<T = mysql.OkPacket>(
		sql: string,
		...values: SQLDataType<{ [key: string]: SQLDataType }>[]
	): Promise<T extends mysql.OkPacket ? mysql.OkPacket : T[]>;
	public query<T = mysql.OkPacket>(sql: string, ...params: unknown[]) {
		if (
			(params.length === 1 || (params.length === 2 && params[1] !== true)) &&
			typeof params[0] == 'object' && params[0] !== null
		) {
			sql = DatabaseManager.format(sql, <SQLValues<SQLValues>>params[0]);
			params = [];
		} else if (sql === SQLQueryTypes.INSERT) {
			sql = DatabaseManager.formatInsert(<string>params[0], <SQLValues>params[1]);
			params = [];
		}
		return new Promise<T[] | mysql.OkPacket>((resolve, reject) => {
			this._mysqlConnection.query(sql, params, (error, rows) => {
				if (error) reject(error);
				else resolve(rows);
			});
		});
	}

	public close() {
		return new Promise<this>((resolve, reject) => {
			this._mysqlConnection.end(error => {
				if (error) reject(error);
				else resolve(this);
			});
		});
	}

	public open() {
		return new Promise<this>((resolve, reject) => {
			this._mysqlConnection.connect(error => {
				if (error) reject(error);
				else resolve(this);
			});
		});
	}
}

export type SQLDataType<E = never> = number | Date | string | null | E;

export interface SQLValues<E = never> {
	[key: string]: SQLDataType | E;
}