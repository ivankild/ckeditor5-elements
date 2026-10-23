import table from './shared/dataTable.json';
import { schemaDemo } from './shared/schemaDemo';

export default schemaDemo(table, {
	labels: { dataTable: 'Table', dataRow: 'Row', dataCell: 'Cell', dataHeader: 'Header cell' },
	data:
		'<p>Right-click a cell, then <b>Insert › Insert after</b>: a cell and a header cell are offered, since they are ' +
		'allowed only in a row. In the paragraph, they are not.</p>' +
		'<div class="dataTable">' +
		'<div class="dataRow"><div class="dataHeader">Element</div><div class="dataHeader">Type</div><div class="dataHeader">Holds</div></div>' +
		'<div class="dataRow"><div class="dataCell">paragraph</div><div class="dataCell">block</div><div class="dataCell">text</div></div>' +
		'<div class="dataRow"><div class="dataCell">note</div><div class="dataCell">container</div><div class="dataCell">blocks</div></div>' +
		'</div>'
});
