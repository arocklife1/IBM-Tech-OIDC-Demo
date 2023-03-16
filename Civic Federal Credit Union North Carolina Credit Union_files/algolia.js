/**    global javascript instantsearch algoliasearch */
const indexname = drupalSettings.algolia.config.indexname;
const appId = drupalSettings.algolia.config.appId;
const apiKey = drupalSettings.algolia.config.apiKey;
const template = drupalSettings.algolia.config.template;
const pagination = drupalSettings.algolia.config.pagination;

if(indexname && appId && apiKey && template) {
    const algoliaClient = algoliasearch(
      appId,
      apiKey
    );

    const searchClient = {
      ...algoliaClient,
      search(requests) {
        if (requests.every(({ params }) => !params.query)) {
          return Promise.resolve({
            results: requests.map(() => ({
              hits: [],
              nbHits: 0,
              nbPages: 0,
              page: 0,
              processingTimeMS: 0,
              hitsPerPage: 0,
              exhaustiveNbHits: false,
              query: '',
              params: '',
            })),
          });
        }

        return algoliaClient.search(requests);
      },
    };


    const search = instantsearch({
        indexName: indexname,
        searchClient,
    });
    /**
     * Facet values we want to re-map
     */
    const facetMapping = {
      blog: 'Blogs',
      faq: 'FAQs',
      page: 'Civic Info',
      product: 'Products',
    };


    search.addWidgets([
        instantsearch.widgets.searchBox({
            container: '#ais-search',
            placeholder: 'Search',
            wrapInput: false,
            showSubmit: false,
            showReset: false,
        }),

        instantsearch.widgets.refinementList({
          container: '#facet-content-types',
          attribute: 'content_type',
          transformItems(items) {
            return items.map(item => ({
              ...item,
              // The label to use
              label: facetMapping[item.value],
              highlighted: facetMapping[item.value]
                ? facetMapping[item.value]
                : item.value,
            }));
          },
        })

    ]);

    /**
     * check to enable pagination
     * pagination limit configurable on algolia account
     */
    if(pagination && pagination != 0) {
        search.addWidgets([
            instantsearch.widgets.pagination({
                container: '#algolia-pagination',
                showFirst: false,
                showLast: false,
                padding: 2
            })
        ]);
    }

    /* Hits widget */
    search.addWidget(
        instantsearch.widgets.hits({
            container: '#algolia-hits',
            templates: {
                empty: `
                    <div class="no-results">
                        <p>We could not find a match for "{{query}}". Please try another search.</p>
                        <ul>
                            <li>Try different or more general keywords</li>
                            <li>Try fewer keywords</li>
                        </ul>
                    </div>
                `,
                item(hit, { html, components }) {
                    return html`
                        <h2 class="ais-Hits-title">
                            <a href=${hit.url}>${components.Highlight({ attribute: 'title', hit })}</a>
                        </h2>
                        <p>${components.Snippet({ attribute: 'product_body', hit })}</p>
                        <p>${components.Snippet({ attribute: 'faq_body', hit })}</p>
                    `;
                },
            },
        })
    );

    /**
     *   Business/Personal menu items with a reset as "All"
     */
    search.addWidget(
        instantsearch.widgets.menu({
            container: '#menu',
            attribute: 'product_category',
            sortBy: ['count:desc', 'name:asc'],
            templates: {
                item: `
                    <a class="{{cssClasses.link}}" href="{{url}}">
                        <span class="{{cssClasses.label}}">{{label}}</span>
                    </a>
                `,
            },

            transformItems(items) {
                var orderedList = ['Business Products','Personal'];
                var returnedItems =[];
                for(ol in orderedList) {
                    for (il in items) {
                        if (orderedList[ol] == items[il].value) {
                            if (items[il].value == 'Business Products'){
                                items[il].label = 'Business'
                            }
                            returnedItems.push(items[il]);
                        }
                    }
                }
                return returnedItems;
            },
        })
    );

    search.addWidget(
        instantsearch.widgets.clearRefinements({
            container: '#clearRefinements',
            cssClasses: {
                link: 'ais-clear-all--link__active'
            },
            templates: {
                resetLabel: 'All',
            },
            autoHideContainer: false
        })
    );

    /* Stats widget */
    search.addWidget(
        instantsearch.widgets.stats({
            container: '#stats',
            templates: {
                text: `
                    {{#areHitsSorted}}
                        {{#hasNoSortedResults}}No Relevant Results{{/hasNoSortedResults}}
                        {{#hasOneSortedResults}}1 Relevant Result{{/hasOneSortedResults}}
                        {{#hasManySortedResults}}{{#helpers.formatNumber}}{{nbSortedHits}}{{/helpers.formatNumber}} Relevant Results{{/hasManySortedResults}}
                        Sorted Out Of {{#helpers.formatNumber}}{{nbHits}}{{/helpers.formatNumber}}
                    {{/areHitsSorted}}
                    {{^areHitsSorted}}
                        {{#hasNoResults}}No Results{{/hasNoResults}}
                        {{#hasOneResult}}1 Result{{/hasOneResult}}
                        {{#hasManyResults}}{{#helpers.formatNumber}}{{nbHits}}{{/helpers.formatNumber}} Results{{/hasManyResults}}
                    {{/areHitsSorted}}
                    Below
                `,
            },
        })
    );

    // Create the render function
    const renderSortBy = (renderOptions, isFirstRender) => {
        const {
            options,
            currentRefinement,
            hasNoResults,
            refine,
            widgetParams,
        } = renderOptions;

        if (isFirstRender) {
            const sortby = document.createElement('ul');

            sortby.addEventListener('click', event => {
                refine(event.target.getAttribute('data-value'));
            });

            widgetParams.container.appendChild(sortby);
        }

        const sortby = widgetParams.container.querySelector('ul');

        sortby.disabled = hasNoResults;

        sortby.innerHTML = `
            ${options
                .map(
                    option => `
                        <li
                            data-value="${option.value}"
                            ${option.value === currentRefinement ? ' class="selected"' : ''}
                        >
                            ${option.label}
                        </li>
                    `
                )
                .join('')}
        `;
    };

// Create the custom widget
    const customSortBy = instantsearch.connectors.connectSortBy(renderSortBy);

    search.addWidgets([
        customSortBy({
            container: document.querySelector('#sort-by'),
            items: [
                { label: 'MOST RELEVANT', value: indexname },
                { label: 'LATEST', value: indexname +'_latest'},
            ],
        })
    ]);

    search.start();

} else
{
    throw "Algolia settings missing";
}
