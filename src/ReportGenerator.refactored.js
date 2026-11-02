const ADMIN_PRIORITY_THRESHOLD = 1000;
const USER_MAX_VALUE = 500;

const ROLE_RULES = {
  ADMIN: {
    canSee: () => true,
    prepare: (item) => {
      if (item.value > ADMIN_PRIORITY_THRESHOLD) {
        item.priority = true;
      }
    },
  },
  USER: {
    canSee: (item) => item.value <= USER_MAX_VALUE,
    prepare: () => {},
  },
};

const FORMATTERS = {
  CSV: {
    header: () => 'ID,NOME,VALOR,USUARIO\n',
    row: (item, user) => `${item.id},${item.name},${item.value},${user.name}\n`,
    footer: (total) => `\nTotal,,\n${total},,\n`,
  },
  HTML: {
    header: (user) =>
      '<html><body>\n' +
      '<h1>Relatório</h1>\n' +
      `<h2>Usuário: ${user.name}</h2>\n` +
      '<table>\n' +
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n',
    row: (item) => {
      const style = item.priority ? ' style="font-weight:bold;"' : '';
      return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
    },
    footer: (total) =>
      '</table>\n' + `<h3>Total: ${total}</h3>\n` + '</body></html>\n',
  },
};

const NULL_FORMATTER = {
  header: () => '',
  row: () => '',
  footer: () => '',
};

const NO_ACCESS_RULE = { canSee: () => false, prepare: () => {} };

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo.
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    const formatter = FORMATTERS[reportType] ?? NULL_FORMATTER;
    const rule = ROLE_RULES[user.role] ?? NO_ACCESS_RULE;

    const visibleItems = this.selectVisibleItems(items, rule);
    const total = this.sumValues(visibleItems);

    const body = visibleItems.map((item) => formatter.row(item, user)).join('');
    const report = formatter.header(user) + body + formatter.footer(total);

    return report.trim();
  }

  selectVisibleItems(items, rule) {
    items.forEach((item) => rule.prepare(item));
    return items.filter((item) => rule.canSee(item));
  }

  sumValues(items) {
    return items.reduce((sum, item) => sum + item.value, 0);
  }
}
