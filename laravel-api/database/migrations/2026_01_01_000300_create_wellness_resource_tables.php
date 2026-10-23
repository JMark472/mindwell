<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wellness content tables (owned by the Laravel service).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wellness_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('description')->nullable();
            $table->string('accent_color', 20)->default('#10A99B');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('wellness_resources', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('wellness_category_id');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt');
            $table->longText('body');
            $table->json('tags')->nullable();
            $table->unsignedSmallInteger('reading_minutes')->default(5);
            $table->string('status', 20)->default('draft'); // draft|published|archived
            $table->boolean('is_featured')->default(false);
            $table->dateTime('published_at')->nullable();
            $table->unsignedBigInteger('created_by_user_id')->nullable();
            $table->timestamps();

            $table->foreign('wellness_category_id')
                ->references('id')->on('wellness_categories')
                ->cascadeOnDelete();
            $table->index(['status', 'is_featured']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wellness_resources');
        Schema::dropIfExists('wellness_categories');
    }
};
