#!/usr/bin/env ruby -w
# frozen_string_literal: true
# encoding: UTF-8
#
# = TernarySearchTree_spec.rb -- The TaskJuggler III Project Management Software
#
# Copyright (c) 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014
#               by Chris Schlaeger <cs@taskjuggler.org>
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of version 2 of the GNU General Public License as
# published by the Free Software Foundation.
#

require 'rubygems'

require 'taskjuggler/TernarySearchTree'

RSpec.configure do |config|
  config.expect_with(:rspec) { |c| c.syntax = :expect }
end

class TaskJuggler

  describe "TernarySearchTree" do

    before do
      @tst = TernarySearchTree.new
    end

    it 'should not contain anything yet' do
      expect(@tst.length).to eq(0)
      expect(@tst['']).to be_nil
    end

    it 'should accept single element on creation' do
      @tst = TernarySearchTree.new('foo')
      expect(@tst.length).to eq(1)
    end

    it 'should accept an Array on creation' do
      @tst = TernarySearchTree.new(%w( foo bar ))
      expect(@tst.length).to eq(2)
    end

    it 'should not accept an empty String' do
      expect { @tst.insert('') }.to raise_error ArgumentError
    end

    it 'should not accept nil' do
      expect { @tst.insert(nil) }.to raise_error ArgumentError
    end

    it 'should store inserted values' do
      v = %w( foo bar foobar barfoo fo ba foo1 bar1 zzz )
      @tst.insertList(v)

      expect(@tst.length).to eq(v.length)
      rv = @tst.to_a.sort
      expect(rv).to eq(v.sort)
    end

    it 'should find exact matches' do
      v = %w( foo bar foobar barfoo fo ba foo1 bar1 zzz )
      v.each { |val| @tst << val }

      v.each do |val|
        expect(@tst[val]).to eq(val)
      end
    end

    it 'should not find non-existing elements' do
      %w( foo bar foobar barfoo fo ba foo1 bar1 zzz ).each { |v| @tst << v }

      expect(@tst['foos']).to be_nil
      expect(@tst['bax']).to be_nil
      expect(@tst['']).to be_nil
    end

    it 'should find partial matches' do
      %w( foo bar foobar barfoo ba foo1 bar1 zzz ).each { |v| @tst << v }

      expect(@tst['foo', true].sort).to eq(%w( foo foobar foo1 ).sort)
      expect(@tst['fo', true].sort).to eq(%w( foo foobar foo1 ).sort)
      expect(@tst['b', true].sort).to eq(%w( bar barfoo ba bar1 ).sort)
      expect(@tst['zzz', true]).to eq([ 'zzz' ])
    end

    it 'should not find non-existing elements' do
      %w( foo bar foobar barfoo fo ba foo1 bar1 zzz ).each { |v| @tst << v }

      expect(@tst['foos', true]).to be_nil
      expect(@tst['', true]).to be_nil
    end

    it 'should store duplicate entries only once' do
      v = %w( foo bar foobar bar foo fo ba foo1 ba foobar bar1 zzz )
      @tst.insertList(v)
      expect(@tst.length).to eq(v.uniq.length)
    end

    it 'maxDepth should work' do
      v = %w( a b c d e f)
      v.each { |val| @tst << val }
      expect(@tst.maxDepth).to eq(v.length)
    end

    it 'should be able to balance a tree' do
      %w( aa ab ac ba bb bc ca cb cc ).each { |v| @tst << v }
      tst = @tst.balanced
      @tst.balance!
      expect(@tst.to_a).to eq(tst.to_a)
      # The tree is not perfectly balanced.
      expect(@tst.maxDepth).to eq(5)
    end

    #it 'should store integer lists' do
    #  @tst.insert([ 0, 1, 2 ])
    #  expect(@tst.length).to eq(1)
    #  expect(@tst.to_a).to eq([ 0, 1, 2 ])
    #end

    #it 'should work with integer lists as well' do
    #  v = [ [ 0, 1, 2], [ 0, 3, 2], [ 1, 3 ], [ 0, 2, 1], [ 1, 0, 3] ]
    #  @tst.insertList(v)
    #  expect(@tst.length).to eq(v.length)
    #  rv = @tst.to_a.sort
    #  expect(rv).to eq(v.sort)
    #end

  end

end

