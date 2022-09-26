class BrickWalls {
	constructor(selector, startId) {
		$(selector).load('./brickwalls/brickwalls.html');

		this.wikiTreeId = startId;
		this.generations = 10; // default to 10, maybe make this an option later
		this.maxAncestors = 0;
		this.totalKnownAncestors = 0;
		this.duplicateAncestors = 0;

		this.checkedAncestors = [];
		this.brickWalls = [];
	}

	processAncestors(id) {
		// figure out the max number of ancestors for the given generations
		this.maxAncestors = this.calculateMaxAncestors(this.generations);

		// get the person's ancestors from the API
		if (this.generations <= 10) {
			WikiTreeAPI.postToAPI({
				action: 'getAncestors',
				key: this.wikiTreeId,
				depth: this.generations
			}).then((data) => {
				const ancestors = data[0]['ancestors'];

				// console.log(ancestors);

				// set total known ancestors; subtract 1 because starting person is included
				this.totalKnownAncestors = ancestors.length - 1;

				$('#status-text').html('Analyzing ancestors.<br/>');

				// go through each ancestor
				ancestors.forEach((ancestor) => {
					// track which ancestors have been processed
					this.checkedAncestors.push(ancestor['Id']);

					if (!this.hasFather(ancestor) || !this.hasMother(ancestor)) {
						// check to see if the ancestor is already in the brickwalls list
						let duplicateAncestor = false;
						this.brickWalls.forEach((brickwall) => {
							if (ancestor['Name'] == brickwall['Name']) {
								duplicateAncestor = true;
							}
						});

						// add to brickwalls list if not already in the list
						if (!duplicateAncestor) {
							// get birth date info
							let birthDate;
							if (!ancestor.hasOwnProperty('BirthDate')) {
								birthDate = '0000-00-00';
							} else {
								birthDate = ancestor['BirthDate'];
							}

							this.brickWalls.push({
								Name: ancestor['Name'],
								BirthDate: birthDate,
								BirthLocation: ancestor['BirthLocation']
							});
						}
					}
				});

				// calculate pedigree collapse
				this.duplicateAncestors = this.calculatePedigreeCollapse(ancestors);

				// show information about the person's ancestors
				$('#status-text').html(
					`Out of ${this.maxAncestors} possible ancestors in ${this.generations} generations, 
                    ${this.totalKnownAncestors} (${Number(
						(this.totalKnownAncestors / this.maxAncestors * 100).toFixed(2)
					)}%) have WikiTree profiles.</br>
                    ${this.duplicateAncestors}/${this.totalKnownAncestors} (${Number(
						(this.duplicateAncestors / this.totalKnownAncestors * 100).toFixed(2)
					)})% 
                    are duplicates due to <a href="https://en.wikipedia.org/wiki/Pedigree_collapse" target="_blank">pedigree collapse</a>.</br>
                    ${this.brickWalls.length} ancestors are missing at least one parent:</br>
                    `
				);

				// add table
				this.createTable();

				//console.log(this.checkedAncestors);
				//console.log(this.brickWalls);
			});
		}
	}

	/**
     * Calculate the maximum possible number of ancestors a person could have in X generations
     */
	calculateMaxAncestors(generations) {
		let totalAncestors = -1;

		for (let i = 0; i < generations + 1; i++) {
			totalAncestors += Math.pow(2, i);
		}

		return totalAncestors;
	}

	/**
     * Calculate pedigree collapse from a list of ancestors
     */
	calculatePedigreeCollapse(ancestors) {
		let currentPerson;
		let duplicate = false;
		let duplicateAncestors = 0;

		while (ancestors.length > 0) {
			currentPerson = ancestors.shift();

			ancestors.forEach((ancestor) => {
				if (currentPerson['Name'] != undefined && currentPerson['Name'] == ancestor['Name'] && !duplicate) {
					duplicate = true;
				}
			});
			if (duplicate) {
				duplicateAncestors++;
				duplicate = false;
			}
		}

		return duplicateAncestors;
	}

	hasFather(person) {
		if (!person.hasOwnProperty('Father') || person['Father'] == 0) {
			return false;
		} else {
			return true;
		}
	}

	hasMother(person) {
		if (!person.hasOwnProperty('Mother') || person['Mother'] == 0) {
			return false;
		} else {
			return true;
		}
	}

	createTable() {
		let rowCount = 1;

		$('#table-head').html(`<tr><th></th><th>Name</th><th>Birth Date</th><th>Birth Place</th></tr>`);

		this.brickWalls.forEach((brickwall) => {
			var table = document.getElementById('leads-table');
			var row = table.insertRow(row);

			row.insertCell(0).innerHTML = rowCount;
			row.insertCell(1).innerHTML = `<a href="https://www.wikitree.com/wiki/${brickwall[
				'Name'
			]} target="_blank">${brickwall['Name']}</a>`;
			row.insertCell(2).innerHTML = brickwall['BirthDate'];
			row.insertCell(3).innerHTML = brickwall['BirthLocation'];

			rowCount++;
		});
	}
}
