source "https://rubygems.org"

# GitHub Pages uses specific gem versions — this Gemfile matches them, so
# what builds locally = what builds on GitHub Pages.
gem "github-pages", group: :jekyll_plugins

group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-include-cache"
  gem "jekyll-paginate"
  gem "jekyll-sitemap"
  gem "jekyll-remote-theme"
end

# Windows / JRuby / mac ARM compatibility
gem "tzinfo-data", platforms: [:mingw, :mswin, :x64_mingw, :jruby]
gem "wdm", "~> 0.1.1", platforms: [:mingw, :mswin, :x64_mingw]
gem "http_parser.rb", "~> 0.6.0", platforms: [:jruby]
gem "webrick", "~> 1.8"
